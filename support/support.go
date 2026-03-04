package supportfunctions

import (
	"Hackathon/datatypes"
	"encoding/json"
	"math/rand"
	"net/http"
	"slices"
	"strconv"
)

var OS = []string{"CentosOS", "Ubuntu"}

// Вспомогательные функции
func SendJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func GenerateRandomIP() string {
	return "192.168." + strconv.Itoa(rand.Intn(255)) + "." + strconv.Itoa(rand.Intn(255))
}

func ValidateCreateRequest(req datatypes.CreateVMRequest) []string {
	var errors []string

	if req.Name == "" {
		errors = append(errors, "name is required")
	}
	if req.OS == "" {
		errors = append(errors, "OS is required")
	}
	if !slices.Contains(OS, req.OS) {
		errors = append(errors, "Unknown OS")
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
