output "api_endpoint" {
  value       = aws_apigatewayv2_api.api.api_endpoint
  description = "API Gateway HTTP API public endpoint URL"
}
