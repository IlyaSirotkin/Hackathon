package handlerfunctions

import (
	"Hackathon/datatypes"
	support "Hackathon/support"
	"encoding/json"
	"log"
	"math/rand"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
)

var (
	vms     = make(map[string]datatypes.VirtualMachine)
	vmMutex sync.RWMutex
)

func GetAllVMs(w http.ResponseWriter, r *http.Request) {
	vmMutex.RLock()
	defer vmMutex.RUnlock()

	status := r.URL.Query().Get("status")
	os := r.URL.Query().Get("os")

	var vmList []datatypes.VirtualMachine
	for _, vm := range vms {
		if status != "" && vm.Status != status {
			continue
		}

		if os != "" && !strings.Contains(strings.ToLower(vm.OS), strings.ToLower(os)) {
			continue
		}
		vmList = append(vmList, vm)
	}

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
	if end > len(vmList) {
		end = len(vmList)
	}

	var paginatedList []datatypes.VirtualMachine
	if start < len(vmList) {
		paginatedList = vmList[start:end]
	} else {
		paginatedList = []datatypes.VirtualMachine{}
	}

	support.SendJSON(w, http.StatusOK, datatypes.APIResponse{
		Success:   true,
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"total": len(vmList),
			"page":  page,
			"limit": limit,
			"vms":   paginatedList,
		},
	})
}

func GetVM(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	vmMutex.RLock()
	defer vmMutex.RUnlock()
	vm, exists := vms[id]
	if !exists {
		support.SendJSON(w, http.StatusNotFound, datatypes.APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "VM not found",
		})
		return
	}

	support.SendJSON(w, http.StatusOK, datatypes.APIResponse{
		Success:   true,
		Timestamp: time.Now(),
		Data:      vm,
	})
}

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

	newID := "vm-" + strconv.Itoa(len(vms)+1)

	newVM := datatypes.VirtualMachine{
		ID:          newID,
		Name:        req.Name,
		OS:          req.OS,
		CPU:         req.CPU,
		RAM:         req.RAM,
		Disk:        req.Disk,
		Status:      "pending",
		IPAddress:   "",
		CreatedTime: time.Now(),
		UpdatedTime: time.Now(),
		Description: req.Description,
	}

	log.Printf("Получен запрос на создание ВМ: %+v", req)

	support.SendJSON(w, http.StatusAccepted, datatypes.APIResponse{
		Success:   true,
		Timestamp: time.Now(),
		Message:   "VM creation request accepted (simulated)",
		Data: map[string]interface{}{
			"vm":             newVM,
			"provisioning":   "in-progress",
			"estimated_time": "30 seconds",
			"note":           "This is a mock API - no actual VM was created",
		},
	})
}

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

	vmMutex.RLock()
	vm, exists := vms[id]
	vmMutex.RUnlock()

	if !exists {
		support.SendJSON(w, http.StatusNotFound, datatypes.APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "VM not found",
		})
		return
	}

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

	updatedVM := datatypes.VirtualMachine{
		ID:          vm.ID,
		Name:        req.Name,
		OS:          req.OS,
		CPU:         req.CPU,
		RAM:         req.RAM,
		Disk:        req.Disk,
		Status:      vm.Status,
		IPAddress:   vm.IPAddress,
		CreatedTime: vm.CreatedTime,
		UpdatedTime: time.Now(),
		Description: req.Description,
	}

	vms[id] = updatedVM
	log.Printf("Получен запрос на полное обновление ВМ %s: %+v", id, req)

	support.SendJSON(w, http.StatusOK, datatypes.APIResponse{
		Success:   true,
		Timestamp: time.Now(),
		Message:   "VM updated successfully (simulated)",
		Data:      updatedVM,
	})
}

func PatchVM(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	var req datatypes.UpdateVMRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		support.SendJSON(w, http.StatusBadRequest, datatypes.APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "Invalid JSON format",
		})
		return
	}

	vmMutex.RLock()
	vm, exists := vms[id]
	vmMutex.RUnlock()

	if !exists {
		support.SendJSON(w, http.StatusNotFound, datatypes.APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "VM not found",
		})
		return
	}

	patchedVM := vm
	patchedVM.UpdatedTime = time.Now()

	if req.Name != nil {
		patchedVM.Name = *req.Name
	}
	if req.CPU != nil {
		patchedVM.CPU = *req.CPU
	}
	if req.RAM != nil {
		patchedVM.RAM = *req.RAM
	}
	if req.Disk != nil {
		patchedVM.Disk = *req.Disk
	}
	if req.Status != nil {
		patchedVM.Status = *req.Status
	}
	if req.Description != nil {
		patchedVM.Description = *req.Description
	}

	log.Printf("Получен запрос на частичное обновление ВМ %s: %+v", id, req)

	support.SendJSON(w, http.StatusOK, datatypes.APIResponse{
		Success:   true,
		Timestamp: time.Now(),
		Message:   "VM patched successfully (simulated)",
		Data:      patchedVM,
	})
}

func DeleteVM(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	vmMutex.RLock()
	_, exists := vms[id]
	vmMutex.RUnlock()

	if !exists {
		support.SendJSON(w, http.StatusNotFound, datatypes.APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "VM not found",
		})
		return
	}

	log.Printf("Получен запрос на удаление ВМ %s", id)

	support.SendJSON(w, http.StatusOK, datatypes.APIResponse{
		Success:   true,
		Timestamp: time.Now(),
		Message:   "VM deleted successfully (simulated)",
		Data: map[string]string{
			"id":      id,
			"status":  "deleted",
			"message": "Note: This is a mock API - no actual VM was deleted",
		},
	})
}

func StartVM(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	handleVMAction(w, id, "start", "running")
}

func StopVM(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	handleVMAction(w, id, "stop", "stopped")
}

func RestartVM(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	handleVMAction(w, id, "restart", "running")
}

func PauseVM(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	handleVMAction(w, id, "pause", "paused")
}

func ResumeVM(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	handleVMAction(w, id, "resume", "running")
}

func handleVMAction(w http.ResponseWriter, id, action, newStatus string) {
	vmMutex.RLock()
	vm, exists := vms[id]
	vmMutex.RUnlock()

	if !exists {
		support.SendJSON(w, http.StatusNotFound, datatypes.APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "VM not found",
		})
		return
	}

	updatedVM := vm
	updatedVM.UpdatedTime = time.Now()

	if action == "restart" {
		updatedVM.Status = "restarting"
	} else {
		updatedVM.Status = newStatus
	}

	if (action == "start" || action == "resume") && updatedVM.IPAddress == "" {
		updatedVM.IPAddress = support.GenerateRandomIP()
	}

	if action == "stop" || action == "pause" {
		updatedVM.IPAddress = ""
	}

	log.Printf("Получен запрос на %s ВМ %s", action, id)

	responseMsg := "VM " + action + "ed"
	if action == "restart" {
		responseMsg = "VM restart initiated"
	}

	support.SendJSON(w, http.StatusAccepted, datatypes.APIResponse{
		Success:   true,
		Timestamp: time.Now(),
		Message:   responseMsg + " (simulated)",
		Data:      updatedVM,
	})
}
func HealthCheck(w http.ResponseWriter, r *http.Request) {
	support.SendJSON(w, http.StatusOK, datatypes.APIResponse{
		Success:   true,
		Timestamp: time.Now(),
		Message:   "Mock VM Management API is healthy",
		Data: map[string]interface{}{
			"status":  "operational",
			"version": "1.0.0",
			"mode":    "mock",
		},
	})
}

func InitTestData() {
	vmMutex.Lock()
	defer vmMutex.Unlock()

	for i := 1; i <= 5; i++ {
		id := "vm-" + strconv.Itoa(i)
		now := time.Now().Add(-time.Duration(rand.Intn(72)) * time.Hour)

		vms[id] = datatypes.VirtualMachine{
			ID:          id,
			Name:        "vm" + strconv.Itoa(i),
			CPU:         []int{1, 2, 4, 8, 16}[rand.Intn(5)],
			RAM:         []int{1024, 2048, 4096, 8192, 16384, 32768}[rand.Intn(6)],
			Disk:        []int{20, 40, 80, 160, 320, 640}[rand.Intn(6)],
			IPAddress:   support.GenerateRandomIP(),
			CreatedTime: now,
			UpdatedTime: now.Add(time.Duration(rand.Intn(24)) * time.Hour),
			Description: "Тестовая ВМ #" + strconv.Itoa(i),
		}
	}
}
