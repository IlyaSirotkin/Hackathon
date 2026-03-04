package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
)

// Модели данных
type VirtualMachine struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	OS          string    `json:"os"`
	CPU         int       `json:"cpu"`
	RAM         int       `json:"ram"`    // в MB
	Disk        int       `json:"disk"`   // в GB
	Status      string    `json:"status"` // running, stopped, paused, error
	IPAddress   string    `json:"ip_address,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Description string    `json:"description,omitempty"`
	Region      string    `json:"region"` // us-east, eu-west, ap-south
}

type CreateVMRequest struct {
	Name        string `json:"name"`
	OS          string `json:"os"`
	CPU         int    `json:"cpu"`
	RAM         int    `json:"ram"`
	Disk        int    `json:"disk"`
	Description string `json:"description,omitempty"`
	Region      string `json:"region,omitempty"`
}

type UpdateVMRequest struct {
	Name        *string `json:"name,omitempty"`
	CPU         *int    `json:"cpu,omitempty"`
	RAM         *int    `json:"ram,omitempty"`
	Disk        *int    `json:"disk,omitempty"`
	Status      *string `json:"status,omitempty"`
	Description *string `json:"description,omitempty"`
	Region      *string `json:"region,omitempty"`
}

type APIResponse struct {
	Success   bool        `json:"success"`
	Message   string      `json:"message,omitempty"`
	Data      interface{} `json:"data,omitempty"`
	Error     string      `json:"error,omitempty"`
	RequestID string      `json:"request_id,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
}

type VMOptions struct {
	CPU  int `json:"cpu"`
	RAM  int `json:"ram"`
	Disk int `json:"disk"`
}

// Хранилище ВМ в памяти
var (
	vms       = make(map[string]VirtualMachine)
	vmMutex   sync.RWMutex
	requestID = 0
)

func main() {
	// Инициализируем случайные тестовые данные
	initTestData()

	// Создаем маршрутизатор
	mux := http.NewServeMux()

	// Регистрируем обработчики
	mux.HandleFunc("GET /api/vms", getAllVMs)
	mux.HandleFunc("POST /api/vms", createVM)
	mux.HandleFunc("GET /api/vms/{id}", getVM)
	mux.HandleFunc("PUT /api/vms/{id}", updateVM)
	mux.HandleFunc("PATCH /api/vms/{id}", patchVM)
	mux.HandleFunc("DELETE /api/vms/{id}", deleteVM)

	// Действия с ВМ
	mux.HandleFunc("POST /api/vms/{id}/start", startVM)
	mux.HandleFunc("POST /api/vms/{id}/stop", stopVM)
	mux.HandleFunc("POST /api/vms/{id}/restart", restartVM)
	mux.HandleFunc("POST /api/vms/{id}/pause", pauseVM)
	mux.HandleFunc("POST /api/vms/{id}/resume", resumeVM)

	// Информационные эндпоинты
	mux.HandleFunc("GET /api/regions", getRegions)
	mux.HandleFunc("GET /api/os-types", getOSTypes)
	mux.HandleFunc("GET /api/stats", getStats)
	mux.HandleFunc("GET /api/health", healthCheck)

	// Добавляем middleware
	handler := loggingMiddleware(mux)
	handler = requestIDMiddleware(handler)
	handler = corsMiddleware(handler)

	// Запускаем сервер
	port := ":8080"

	log.Fatal(http.ListenAndServe(port, handler))
}

// Middleware для добавления request ID
func requestIDMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestID++
		ctx := r.Context()
		r = r.WithContext(ctx)
		w.Header().Set("X-Request-ID", strconv.Itoa(requestID))
		next.ServeHTTP(w, r)
	})
}

// Middleware для логирования
func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		log.Printf("[%s] %s %s", r.Method, r.URL.Path, r.RemoteAddr)

		wrapper := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
		next.ServeHTTP(wrapper, r)

		log.Printf("[%d] %s %s (время: %v)",
			wrapper.statusCode,
			r.Method,
			r.URL.Path,
			time.Since(start))
	})
}

// Middleware для CORS
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID")
		w.Header().Set("Access-Control-Expose-Headers", "X-Request-ID")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

// Инициализация тестовых данных
func initTestData() {
	vmMutex.Lock()
	defer vmMutex.Unlock()

	// Создаем несколько тестовых ВМ
	for i := 1; i <= 5; i++ {
		id := "vm-" + strconv.Itoa(i)
		now := time.Now().Add(-time.Duration(rand.Intn(72)) * time.Hour)

		vms[id] = VirtualMachine{
			ID:          id,
			Name:        "vm-" + strconv.Itoa(i),
			CPU:         []int{1, 2, 4, 8, 16}[rand.Intn(5)],
			RAM:         []int{1024, 2048, 4096, 8192, 16384, 32768}[rand.Intn(6)],
			Disk:        []int{20, 40, 80, 160, 320, 640}[rand.Intn(6)],
			IPAddress:   generateRandomIP(),
			CreatedAt:   now,
			UpdatedAt:   now.Add(time.Duration(rand.Intn(24)) * time.Hour),
			Description: "Тестовая ВМ #" + strconv.Itoa(i),
		}
	}
}

// Получить все ВМ
func getAllVMs(w http.ResponseWriter, r *http.Request) {
	vmMutex.RLock()
	defer vmMutex.RUnlock()

	// Парсим параметры фильтрации
	status := r.URL.Query().Get("status")
	region := r.URL.Query().Get("region")
	os := r.URL.Query().Get("os")

	var vmList []VirtualMachine
	for _, vm := range vms {
		if status != "" && vm.Status != status {
			continue
		}
		if region != "" && vm.Region != region {
			continue
		}
		if os != "" && !strings.Contains(strings.ToLower(vm.OS), strings.ToLower(os)) {
			continue
		}
		vmList = append(vmList, vm)
	}

	// Добавляем пагинацию
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

	var paginatedList []VirtualMachine
	if start < len(vmList) {
		paginatedList = vmList[start:end]
	} else {
		paginatedList = []VirtualMachine{}
	}

	sendJSON(w, http.StatusOK, APIResponse{
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

// Получить ВМ по ID
func getVM(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	vmMutex.RLock()
	defer vmMutex.RUnlock()
	fmt.Println("работает")
	vm, exists := vms[id]
	if !exists {
		sendJSON(w, http.StatusNotFound, APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "VM not found",
		})
		return
	}

	sendJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Timestamp: time.Now(),
		Data:      vm,
	})
}

// Создать ВМ (имитация - ничего реально не создаем)
func createVM(w http.ResponseWriter, r *http.Request) {
	var req CreateVMRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "Invalid JSON format",
		})
		return
	}

	// Валидация
	errors := validateCreateRequest(req)
	if len(errors) > 0 {
		sendJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "Validation failed",
			Data:      map[string]interface{}{"errors": errors},
		})
		return
	}

	// Генерируем ID для "созданной" ВМ
	newID := "vm-" + strconv.Itoa(len(vms)+1)

	// Создаем объект ВМ (только для ответа, не сохраняем)
	newVM := VirtualMachine{
		ID:          newID,
		Name:        req.Name,
		OS:          req.OS,
		CPU:         req.CPU,
		RAM:         req.RAM,
		Disk:        req.Disk,
		Status:      "pending", // Начинает со статуса pending
		IPAddress:   "",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		Description: req.Description,
		Region:      req.Region,
	}

	// Выбираем регион по умолчанию если не указан
	if newVM.Region == "" {
		newVM.Region = "us-east"
	}

	// Логируем полученный запрос (но ничего не создаем)
	log.Printf("Получен запрос на создание ВМ: %+v", req)

	// Отправляем ответ с имитацией создания
	sendJSON(w, http.StatusAccepted, APIResponse{
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

// Полностью обновить ВМ (PUT)
func updateVM(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	var req CreateVMRequest // PUT ожидает все поля
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendJSON(w, http.StatusBadRequest, APIResponse{
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
		sendJSON(w, http.StatusNotFound, APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "VM not found",
		})
		return
	}

	// Валидация
	errors := validateCreateRequest(req)
	if len(errors) > 0 {
		sendJSON(w, http.StatusBadRequest, APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "Validation failed",
			Data:      map[string]interface{}{"errors": errors},
		})
		return
	}

	// Создаем обновленную версию для ответа
	updatedVM := VirtualMachine{
		ID:          vm.ID,
		Name:        req.Name,
		OS:          req.OS,
		CPU:         req.CPU,
		RAM:         req.RAM,
		Disk:        req.Disk,
		Status:      vm.Status,
		IPAddress:   vm.IPAddress,
		CreatedAt:   vm.CreatedAt,
		UpdatedAt:   time.Now(),
		Description: req.Description,
		Region:      req.Region,
	}

	log.Printf("📝 Получен запрос на полное обновление ВМ %s: %+v", id, req)

	sendJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Timestamp: time.Now(),
		Message:   "VM updated successfully (simulated)",
		Data:      updatedVM,
	})
}

// Частично обновить ВМ (PATCH)
func patchVM(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	var req UpdateVMRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendJSON(w, http.StatusBadRequest, APIResponse{
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
		sendJSON(w, http.StatusNotFound, APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "VM not found",
		})
		return
	}

	// Создаем обновленную версию на основе существующей
	patchedVM := vm
	patchedVM.UpdatedAt = time.Now()

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
	if req.Region != nil {
		patchedVM.Region = *req.Region
	}

	log.Printf("📝 Получен запрос на частичное обновление ВМ %s: %+v", id, req)

	sendJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Timestamp: time.Now(),
		Message:   "VM patched successfully (simulated)",
		Data:      patchedVM,
	})
}

// Удалить ВМ (имитация)
func deleteVM(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	vmMutex.RLock()
	_, exists := vms[id]
	vmMutex.RUnlock()

	if !exists {
		sendJSON(w, http.StatusNotFound, APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "VM not found",
		})
		return
	}

	log.Printf("🗑️ Получен запрос на удаление ВМ %s", id)

	sendJSON(w, http.StatusOK, APIResponse{
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

// Действия с ВМ
func startVM(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	handleVMAction(w, id, "start", "running")
}

func stopVM(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	handleVMAction(w, id, "stop", "stopped")
}

func restartVM(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	handleVMAction(w, id, "restart", "running")
}

func pauseVM(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	handleVMAction(w, id, "pause", "paused")
}

func resumeVM(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	handleVMAction(w, id, "resume", "running")
}

func handleVMAction(w http.ResponseWriter, id, action, newStatus string) {
	vmMutex.RLock()
	vm, exists := vms[id]
	vmMutex.RUnlock()

	if !exists {
		sendJSON(w, http.StatusNotFound, APIResponse{
			Success:   false,
			Timestamp: time.Now(),
			Error:     "VM not found",
		})
		return
	}

	// Создаем копию с обновленным статусом
	updatedVM := vm
	updatedVM.UpdatedAt = time.Now()

	if action == "restart" {
		updatedVM.Status = "restarting"
	} else {
		updatedVM.Status = newStatus
	}

	// Для start/resume добавляем IP если его нет
	if (action == "start" || action == "resume") && updatedVM.IPAddress == "" {
		updatedVM.IPAddress = generateRandomIP()
	}

	// Для stop/pause убираем IP
	if action == "stop" || action == "pause" {
		updatedVM.IPAddress = ""
	}

	log.Printf("🔄 Получен запрос на %s ВМ %s", action, id)

	responseMsg := "VM " + action + "ed"
	if action == "restart" {
		responseMsg = "VM restart initiated"
	}

	sendJSON(w, http.StatusAccepted, APIResponse{
		Success:   true,
		Timestamp: time.Now(),
		Message:   responseMsg + " (simulated)",
		Data:      updatedVM,
	})
}

// Информационные эндпоинты
func getRegions(w http.ResponseWriter, r *http.Request) {
	regionDetails := []map[string]interface{}{
		{"id": "us-east", "name": "US East (N. Virginia)", "available": true},
		{"id": "us-west", "name": "US West (Oregon)", "available": true},
		{"id": "eu-west", "name": "EU West (Ireland)", "available": true},
		{"id": "eu-central", "name": "EU Central (Frankfurt)", "available": true},
		{"id": "ap-south", "name": "Asia Pacific (Mumbai)", "available": true},
		{"id": "ap-northeast", "name": "Asia Pacific (Tokyo)", "available": false},
	}

	sendJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Timestamp: time.Now(),
		Data:      regionDetails,
	})
}

func getOSTypes(w http.ResponseWriter, r *http.Request) {
	osDetails := []map[string]interface{}{
		{"id": "ubuntu-22.04", "name": "Ubuntu 22.04 LTS", "versions": []string{"22.04", "20.04"}},
		{"id": "centos-9", "name": "CentOS 9", "versions": []string{"9", "8"}},
		{"id": "debian-12", "name": "Debian 12", "versions": []string{"12", "11"}},
		{"id": "windows-2022", "name": "Windows Server 2022", "versions": []string{"2022", "2019"}},
		{"id": "fedora-38", "name": "Fedora 38", "versions": []string{"38", "37"}},
	}

	sendJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Timestamp: time.Now(),
		Data:      osDetails,
	})
}

func getStats(w http.ResponseWriter, r *http.Request) {
	vmMutex.RLock()
	defer vmMutex.RUnlock()

	stats := map[string]interface{}{
		"total_vms": len(vms),
		"by_status": map[string]int{
			"running": 0,
			"stopped": 0,
			"paused":  0,
			"error":   0,
		},
		"by_region": make(map[string]int),
		"total_resources": map[string]interface{}{
			"cpu":  0,
			"ram":  0,
			"disk": 0,
		},
		"timestamp": time.Now(),
	}

	for _, vm := range vms {
		// По статусу
		stats["by_status"].(map[string]int)[vm.Status]++

		// По региону
		stats["by_region"].(map[string]int)[vm.Region]++

		// Ресурсы
		stats["total_resources"].(map[string]interface{})["cpu"] =
			stats["total_resources"].(map[string]interface{})["cpu"].(int) + vm.CPU
		stats["total_resources"].(map[string]interface{})["ram"] =
			stats["total_resources"].(map[string]interface{})["ram"].(int) + vm.RAM
		stats["total_resources"].(map[string]interface{})["disk"] =
			stats["total_resources"].(map[string]interface{})["disk"].(int) + vm.Disk
	}

	sendJSON(w, http.StatusOK, APIResponse{
		Success:   true,
		Timestamp: time.Now(),
		Data:      stats,
	})
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
	sendJSON(w, http.StatusOK, APIResponse{
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

// Вспомогательные функции
func sendJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func generateRandomIP() string {
	return "192.168." + strconv.Itoa(rand.Intn(255)) + "." + strconv.Itoa(rand.Intn(255))
}

func validateCreateRequest(req CreateVMRequest) []string {
	var errors []string

	if req.Name == "" {
		errors = append(errors, "name is required")
	}
	if req.OS == "" {
		errors = append(errors, "OS is required")
	}
	if req.CPU < 1 || req.CPU > 64 {
		errors = append(errors, "CPU must be between 1 and 64")
	}
	if req.RAM < 512 || req.RAM > 262144 {
		errors = append(errors, "RAM must be between 512 MB and 262144 MB (256 GB)")
	}
	if req.Disk < 10 || req.Disk > 10000 {
		errors = append(errors, "Disk must be between 10 GB and 10000 GB (10 TB)")
	}

	return errors
}

func init() {
	rand.Seed(time.Now().UnixNano())
}
