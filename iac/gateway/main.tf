resource "aws_cloudwatch_log_group" "gateway" {
  name              = "/apigateway/${var.project_name}-api"
  retention_in_days = 7

  tags = {
    project = var.project_name
    Name    = "${var.project_name}-api-gateway-logs"
  }
}

resource "aws_apigatewayv2_vpc_link" "api" {
  name               = "${var.project_name}-api-vpc-link"
  security_group_ids = var.security_group_ids
  subnet_ids         = var.subnet_ids

  tags = {
    project = var.project_name
    Name    = "${var.project_name}-api-vpc-link"
  }
}

resource "aws_apigatewayv2_api" "api" {
  name          = "${var.project_name}-api-gateway"
  protocol_type = "HTTP"

  tags = {
    project = var.project_name
    Name    = "${var.project_name}-api-gateway"
  }
}

resource "aws_apigatewayv2_integration" "api" {
  api_id             = aws_apigatewayv2_api.api.id
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  integration_uri    = var.alb_listener_arn
  connection_type    = "VPC_LINK"
  connection_id      = aws_apigatewayv2_vpc_link.api.id
}

resource "aws_apigatewayv2_route" "proxy" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.api.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true


  tags = {
    project = var.project_name
    Name    = "${var.project_name}-api-stage"
  }
}
