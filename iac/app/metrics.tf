locals {
  api_observability_namespace = "${var.project_name}/api"
}

resource "aws_cloudwatch_log_metric_filter" "request_count" {
  name           = "${var.project_name}-api-request-count"
  log_group_name = aws_cloudwatch_log_group.api.name
  pattern        = "{ $.type = \"http_request\" && $.path = * && $.statusCode = * && $.duration = * }"

  metric_transformation {
    name      = "RequestCount"
    namespace = local.api_observability_namespace
    value     = "1"
    unit      = "Count"

    dimensions = {
      Path = "$.path"
    }
  }
}

resource "aws_cloudwatch_log_metric_filter" "status_code" {
  name           = "${var.project_name}-api-status-code"
  log_group_name = aws_cloudwatch_log_group.api.name
  pattern        = "{ $.type = \"http_request\" && $.path = * && $.statusCode = * }"

  metric_transformation {
    name      = "StatusCode"
    namespace = local.api_observability_namespace
    value     = "$.statusCode"
    unit      = "None"

    dimensions = {
      Path = "$.path"
    }
  }
}

resource "aws_cloudwatch_log_metric_filter" "duration" {
  name           = "${var.project_name}-api-request-duration"
  log_group_name = aws_cloudwatch_log_group.api.name
  pattern        = "{ $.type = \"http_request\" && $.path = * && $.duration = * }"

  metric_transformation {
    name      = "RequestDurationMs"
    namespace = local.api_observability_namespace
    value     = "$.duration"
    unit      = "Milliseconds"

    dimensions = {
      Path = "$.path"
    }
  }
}

resource "aws_cloudwatch_log_metric_filter" "error_count" {
  name           = "${var.project_name}-api-error-count"
  log_group_name = aws_cloudwatch_log_group.api.name
  pattern        = "{ $.type = \"http_error\" && $.path = * && $.err.name = * }"

  metric_transformation {
    name      = "ErrorCount"
    namespace = local.api_observability_namespace
    value     = "1"
    unit      = "Count"

    dimensions = {
      Path = "$.path"
    }
  }
}