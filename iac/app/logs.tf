resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${var.project_name}-api"
  retention_in_days = 7

  tags = {
    project = var.project_name
    Name    = "${var.project_name}-api-log-group"
  }
}

resource "aws_cloudwatch_dashboard" "api" {
  dashboard_name = "${var.project_name}-api-observability"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          period  = 60
          stat    = "p50"
          title   = "Median status code by path"
          metrics = [
            [
              {
                expression = "SEARCH('{${local.api_observability_namespace},Path} MetricName=\"StatusCode\"', 'p50', 60)"
                id         = "statusCodeSearch"
                label      = "Median status code"
              }
            ]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          period  = 60
          stat    = "Sum"
          title   = "Requests per minute by path"
          metrics = [
            [
              {
                expression = "SEARCH('{${local.api_observability_namespace},Path} MetricName=\"RequestCount\"', 'Sum', 60)"
                id         = "requestCountSearch"
                label      = "Requests"
              }
            ]
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          period  = 60
          stat    = "Average"
          title   = "Average request duration by path"
          metrics = [
            [
              {
                expression = "SEARCH('{${local.api_observability_namespace},Path} MetricName=\"RequestDurationMs\"', 'Average', 60)"
                id         = "durationSearch"
                label      = "Avg duration (ms)"
              }
            ]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6

        properties = {
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          period  = 60
          title   = "Error rate by path"
          metrics = [
            [
              {
                expression = "SEARCH('{${local.api_observability_namespace},Path} MetricName=\"ErrorCount\"', 'Sum', 60)"
                id         = "errorCountSearch"
                label      = "Errors"
              }
            ],
            [
              {
                expression = "SEARCH('{${local.api_observability_namespace},Path} MetricName=\"RequestCount\"', 'Sum', 60)"
                id         = "requestCountForErrorRate"
                label      = "Requests"
              }
            ],
            [
              {
                expression = "IF(requestCountForErrorRate > 0, 100 * errorCountSearch / requestCountForErrorRate, 0)"
                id         = "errorRate"
                label      = "Error rate (%)"
              }
            ]
          ]
        }
      }
    ]
  })
}
