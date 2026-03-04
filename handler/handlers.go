package handlerfunctions

import (
	"Hackathon/datatypes"
	support "Hackathon/support"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/Telmate/proxmox-api-go/proxmox"
)

var (
	vms     = make(map[string]datatypes.VirtualMachine)
	vmMutex sync.RWMutex

	// Proxmox клиент
	proxmoxClient *proxmox.Client
	proxmoxNode   string
)

// Инициализация подключения к Proxmox
func InitProxmox(apiURL, username, password, node string) error {
	// Создаем клиент
	client, err := proxmox.NewClient(apiURL, nil, nil, "", 300)
	if err != nil {
		return err
	}

	// Аутентификация
	err = client.Login(username, password, "")
	if err != nil {
		return err
	}

	proxmoxClient = client
	proxmoxNode = node
	log.Printf("Подключение к Proxmox установлено: %s", apiURL)
	return nil
}

// GetAllVMs - получает список ВМ из Proxmox
func GetAllVMs(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()

	// Получаем список всех ВМ из Proxmox
	vmsList, err := proxmoxClient.GetVmList()
	if err != nil {
		support.SendJSON(w, http.StatusInternalServerError, datatypes.APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "Failed to get VMs: " + err.Error(),
		})
		return
	}

	// Конвертируем в наш формат
	var vmList []datatypes.VirtualMachine
	for _, vm := range vmsList {
		// Получаем детальную информацию о ВМ
		vmr := proxmox.NewVmRef(vm.Vmid)
		vmr.SetNode(proxmoxNode)

		config, err := proxmoxClient.GetVmConfig(vmr)
		if err != nil {
			continue // Пропускаем ВМ, если не можем получить конфиг
		}

		// Получаем статус
		status, err := proxmoxClient.GetVmState(vmr)
		if err != nil {
			continue
		}

		ourVM := convertProxmoxToOurVM(vm, config, status)
		vmList = append(vmList, ourVM)
	}

	// Фильтрация (как в вашем коде)
	status := r.URL.Query().Get("status")
	os := r.URL.Query().Get("os")

	filteredList := filterVMs(vmList, status, os)

	// Пагинация
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}

	start := (page - 1) * limit
	end := start + limit
	if end > len(filteredList) {
		end = len(filteredList)
	}

	var paginatedList []datatypes.VirtualMachine
	if start < len(filteredList) {
		paginatedList = filteredList[start:end]
	} else {
		paginatedList = []datatypes.VirtualMachine{}
	}

	support.SendJSON(w, http.StatusOK, datatypes.APIResponse{
		Success:   true,
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"total": len(filteredList),
			"page":  page,
			"limit": limit,
			"vms":   paginatedList,
		},
	})
}

// CreateVM - создает реальную ВМ в Proxmox
func CreateVM(w http.ResponseWriter, r *http.Request) {
	var req datatypes.CreateVMRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		support.SendJSON(w, http.StatusBadRequest, datatypes.APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "Invalid JSON format",
		})
		return
	}

	// Валидация
	errors := support.ValidateCreateRequest(req)
	if len(errors) > 0 {
		support.SendJSON(w, http.StatusBadRequest, datatypes.APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "Validation failed",
			Data:      map[string]interface{}{"errors": errors},
		})
		return
	}

	// Генерируем VMID
	nextID, err := getNextVMID()
	if err != nil {
		support.SendJSON(w, http.StatusInternalServerError, datatypes.APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "Failed to generate VM ID",
		})
		return
	}

	// Создаем конфигурацию для Proxmox
	vmConfig := proxmox.ConfigQemu{
		Name:        req.Name,
		Description: req.Description,
		Memory:      req.RAM,
		QemuCores:   req.CPU,
		QemuSockets: 1,
		QemuOs:      getProxmoxOSType(req.OS),
		QemuDisks: map[int]map[string]interface{}{
			0: {
				"type":    "virtio",
				"size":    req.Disk,
				"storage": "local-lvm",
			},
		},
		QemuNetworks: map[int]map[string]interface{}{
			0: {
				"model":  "virtio",
				"bridge": "vmbr0",
			},
		},
		QemuIso: "local:iso/ubuntu-22.04.iso", // Настройте под ваш ISO
	}

	// Создаем ВМ
	vmr := proxmox.NewVmRef(nextID)
	vmr.SetNode(proxmoxNode)

	_, err = proxmoxClient.CreateQemuVm(vmr, vmConfig)
	if err != nil {
		support.SendJSON(w, http.StatusInternalServerError, datatypes.APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "Failed to create VM: " + err.Error(),
		})
		return
	}

	// Сохраняем в нашей мапе для быстрого доступа
	newVM := datatypes.VirtualMachine{
		ID:          strconv.Itoa(nextID),
		Name:        req.Name,
		OS:          req.OS,
		CPU:         req.CPU,
		RAM:         req.RAM,
		Disk:        req.Disk,
		Status:      "stopped",
		IPAddress:   "",
		CreatedTime: time.Now(),
		UpdatedTime: time.Now(),
		Description: req.Description,
	}

	vmMutex.Lock()
	vms[newVM.ID] = newVM
	vmMutex.Unlock()

	log.Printf("Создана ВМ ID %d: %s", nextID, req.Name)

	support.SendJSON(w, http.StatusCreated, datatypes.APIResponse{
		Success:   true,
		Timestamp: time.Now(),
		Message:   "VM created successfully",
		Data:      newVM,
	})
}

// StartVM - запускает ВМ
func StartVM(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	// Конвертируем ID в число для Proxmox
	vmID, err := strconv.Atoi(id)
	if err != nil {
		support.SendJSON(w, http.StatusBadRequest, datatypes.APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "Invalid VM ID format",
		})
		return
	}

	// Создаем ссылку на ВМ
	vmr := proxmox.NewVmRef(vmID)
	vmr.SetNode(proxmoxNode)

	// Запускаем ВМ
	_, err = proxmoxClient.StartVm(vmr)
	if err != nil {
		support.SendJSON(w, http.StatusInternalServerError, datatypes.APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "Failed to start VM: " + err.Error(),
		})
		return
	}

	// Обновляем статус в нашей мапе
	vmMutex.Lock()
	if vm, exists := vms[id]; exists {
		vm.Status = "running"
		vm.UpdatedTime = time.Now()
		vms[id] = vm
	}
	vmMutex.Unlock()

	log.Printf("Запущена ВМ ID %s", id)

	support.SendJSON(w, http.StatusOK, datatypes.APIResponse{
		Success:   true,
		Timestamp: time.Now(),
		Message:   "VM started successfully",
		Data: map[string]string{
			"id":     id,
			"status": "running",
		},
	})
}

// StopVM - останавливает ВМ
func StopVM(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	vmID, err := strconv.Atoi(id)
	if err != nil {
		support.SendJSON(w, http.StatusBadRequest, datatypes.APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "Invalid VM ID format",
		})
		return
	}

	vmr := proxmox.NewVmRef(vmID)
	vmr.SetNode(proxmoxNode)

	// Останавливаем ВМ
	_, err = proxmoxClient.StopVm(vmr)
	if err != nil {
		support.SendJSON(w, http.StatusInternalServerError, datatypes.APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "Failed to stop VM: " + err.Error(),
		})
		return
	}

	// Обновляем статус
	vmMutex.Lock()
	if vm, exists := vms[id]; exists {
		vm.Status = "stopped"
		vm.UpdatedTime = time.Now()
		vms[id] = vm
	}
	vmMutex.Unlock()

	log.Printf("Остановлена ВМ ID %s", id)

	support.SendJSON(w, http.StatusOK, datatypes.APIResponse{
		Success:   true,
		Timestamp: time.Now(),
		Message:   "VM stopped successfully",
		Data: map[string]string{
			"id":     id,
			"status": "stopped",
		},
	})
}

// DeleteVM - удаляет ВМ
func DeleteVM(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	vmID, err := strconv.Atoi(id)
	if err != nil {
		support.SendJSON(w, http.StatusBadRequest, datatypes.APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "Invalid VM ID format",
		})
		return
	}

	vmr := proxmox.NewVmRef(vmID)
	vmr.SetNode(proxmoxNode)

	// Сначала останавливаем, если запущена
	status, err := proxmoxClient.GetVmState(vmr)
	if err == nil && status["status"] == "running" {
		proxmoxClient.StopVm(vmr)
		// Ждем остановки
		time.Sleep(5 * time.Second)
	}

	// Удаляем ВМ
	err = proxmoxClient.DeleteVm(vmr)
	if err != nil {
		support.SendJSON(w, http.StatusInternalServerError, datatypes.APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "Failed to delete VM: " + err.Error(),
		})
		return
	}

	// Удаляем из нашей мапы
	vmMutex.Lock()
	delete(vms, id)
	vmMutex.Unlock()

	log.Printf("Удалена ВМ ID %s", id)

	support.SendJSON(w, http.StatusOK, datatypes.APIResponse{
		Success:   true,
		Timestamp: time.Now(),
		Message:   "VM deleted successfully",
	})
}

// UpdateVM - обновляет конфигурацию ВМ
func UpdateVM(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	var req datatypes.CreateVMRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		support.SendJSON(w, http.StatusBadRequest, datatypes.APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "Invalid JSON format",
		})
		return
	}

	vmID, err := strconv.Atoi(id)
	if err != nil {
		support.SendJSON(w, http.StatusBadRequest, datatypes.APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "Invalid VM ID format",
		})
		return
	}

	vmr := proxmox.NewVmRef(vmID)
	vmr.SetNode(proxmoxNode)

	// Обновляем конфигурацию
	config := map[string]interface{}{
		"name":        req.Name,
		"description": req.Description,
		"memory":      req.RAM,
		"cores":       req.CPU,
	}

	err = proxmoxClient.SetVmConfig(vmr, config)
	if err != nil {
		support.SendJSON(w, http.StatusInternalServerError, datatypes.APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "Failed to update VM: " + err.Error(),
		})
		return
	}

	// Обновляем в нашей мапе
	vmMutex.Lock()
	if vm, exists := vms[id]; exists {
		vm.Name = req.Name
		vm.CPU = req.CPU
		vm.RAM = req.RAM
		vm.Disk = req.Disk
		vm.Description = req.Description
		vm.UpdatedTime = time.Now()
		vms[id] = vm
	}
	vmMutex.Unlock()

	support.SendJSON(w, http.StatusOK, datatypes.APIResponse{
		Success:   true,
		Timestamp: time.Now(),
		Message:   "VM updated successfully",
	})
}

// Вспомогательные функции
func getNextVMID() (int, error) {
	// Получаем следующий свободный ID от Proxmox
	return proxmoxClient.GetNextID(0)
}

func convertProxmoxToOurVM(pvm proxmox.VmRef, config map[string]interface{}, status map[string]interface{}) datatypes.VirtualMachine {
	vm := datatypes.VirtualMachine{
		ID:     strconv.Itoa(pvm.VmId()),
		Name:   config["name"].(string),
		Status: status["status"].(string),
	}

	// Извлекаем ресурсы
	if cpu, ok := config["cores"]; ok {
		vm.CPU = int(cpu.(float64))
	}

	if mem, ok := config["memory"]; ok {
		vm.RAM = int(mem.(float64))
	}

	// Получаем IP если есть
	if status["ip-addresses"] != nil {
		// Логика извлечения IP
	}

	return vm
}

func filterVMs(vms []datatypes.VirtualMachine, status, os string) []datatypes.VirtualMachine {
	var filtered []datatypes.VirtualMachine
	for _, vm := range vms {
		if status != "" && vm.Status != status {
			continue
		}
		if os != "" && !strings.Contains(strings.ToLower(vm.OS), strings.ToLower(os)) {
			continue
		}
		filtered = append(filtered, vm)
	}
	return filtered
}

func getProxmoxOSType(os string) string {
	os = strings.ToLower(os)
	switch {
	case strings.Contains(os, "ubuntu"), strings.Contains(os, "debian"):
		return "l26"
	case strings.Contains(os, "centos"), strings.Contains(os, "rhel"):
		return "l26"
	case strings.Contains(os, "windows"):
		return "win10"
	default:
		return "other"
	}
}
