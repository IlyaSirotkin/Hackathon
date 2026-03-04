package datatypes

import "time"

type VirtualMachine struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	OS          string    `json:"os"`
	CPU         int       `json:"cpu"`
	RAM         int       `json:"ram"`    // в MB
	Disk        int       `json:"disk"`   // в GB
	Status      string    `json:"status"` // running, stopped, paused, error
	IPAddress   string    `json:"ip_address,omitempty"`
	CreatedTime time.Time `json:"created_at"`
	UpdatedTime time.Time `json:"updated_at"`
	Description string    `json:"description,omitempty"`
}

type CreateVMRequest struct {
	Name        string `json:"name"`
	OS          string `json:"os"`
	CPU         int    `json:"cpu"`
	RAM         int    `json:"ram"`
	Disk        int    `json:"disk"`
	Description string `json:"description,omitempty"`
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
