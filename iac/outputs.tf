output "api_endpoint" {
  value       = module.gateway.api_endpoint
  description = "Public API endpoint for the backend HTTP API"
}

output "alb_listener_arn" {
  value       = module.app.listener_arn
  description = "ALB listener ARN created for the backend API"
}