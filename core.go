package main

import (
	handlers "Hackathon/handler"
	"log"
	"net/http"
	"strconv"
	"time"
)

var requestID = 0

func main() {

	handlers.InitTestData()

	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/vms", handlers.GetAllVMs)
	mux.HandleFunc("POST /api/vms", handlers.CreateVM)
	mux.HandleFunc("GET /api/vms/{id}", handlers.GetVM)
	mux.HandleFunc("PUT /api/vms/{id}", handlers.UpdateVM)
	mux.HandleFunc("PATCH /api/vms/{id}", handlers.PatchVM)
	mux.HandleFunc("DELETE /api/vms/{id}", handlers.DeleteVM)

	mux.HandleFunc("POST /api/vms/{id}/start", handlers.StartVM)
	mux.HandleFunc("POST /api/vms/{id}/stop", handlers.StopVM)
	mux.HandleFunc("POST /api/vms/{id}/restart", handlers.RestartVM)
	mux.HandleFunc("POST /api/vms/{id}/pause", handlers.PauseVM)
	mux.HandleFunc("POST /api/vms/{id}/resume", handlers.ResumeVM)

	mux.HandleFunc("GET /api/health", handlers.HealthCheck)

	handler := loggingMiddleware(mux)
	handler = requestIDMiddleware(handler)
	handler = corsMiddleware(handler)

	port := ":8080"

	log.Fatal(http.ListenAndServe(port, handler))
}

func requestIDMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestID++
		ctx := r.Context()
		ctx.Value(requestID)
		r = r.WithContext(ctx)
		w.Header().Set("X-Request-ID", strconv.Itoa(requestID))
		next.ServeHTTP(w, r)
	})
}

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
