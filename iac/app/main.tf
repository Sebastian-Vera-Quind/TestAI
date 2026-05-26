resource "aws_ecs_service" "api" {
  name = "${var.project_name}-api-service"
  cluster = var.ecs_cluster_id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count = var.desired_count
  launch_type = "FARGATE"

  network_configuration {
    subnets = var.subnet_ids
    security_groups = var.security_group_ids
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name = "api"
    container_port = var.container_port
  }

  deployment_controller {
    type = "ECS"
  }

  tags = {
    project = var.project_name
    Name    = "${var.project_name}-api-service"
  }
}

resource "aws_ecs_task_definition" "api" {
  family = "${var.project_name}-api-task"
  network_mode = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  
  cpu = var.api_cpu
  memory = var.api_memory
  execution_role_arn = var.ecs_role_arn
  task_role_arn = var.ecs_role_arn

  container_definitions = jsonencode([
    {
      name = "api"
      image = "${var.container_image_url}:${var.container_image_tag}"
      portMappings = [
        {
          containerPort = var.container_port
          protocol = "tcp"
        }
      ]
      
      environment = [
        {
          name = "DB_HOST"
          value = tostring(var.db_host)
        },
        {
          name = "DB_PORT"
          value = tostring(var.db_port)
        },
        {
          name = "DB_USERNAME"
          value = tostring(var.db_username)
        },
        {
          name = "DB_PASSWORD"
          value = tostring(var.db_password)
        },
        {
          name = "DB_NAME"
          value = tostring(var.db_name)
        },
        {
          name = "PORT"
          value = tostring(var.container_port)
        },
        {
          name = "NODE_ENV"
          value = "production"
        },
        {
          name = "DB_SSL_CA_PATH"
          value = "/app/global-bundle.pem"
        },
        {
          name = "GENERATE_OPENAPI_DOCS"
          value = tostring(var.generate_openapi_docs)
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group" = aws_cloudwatch_log_group.api.name
          "awslogs-region" = var.aws_region
          "awslogs-stream-prefix" = "ECS[api]"
        }
      }

      healthCheck = {
        command = ["node", "/app/health.js"]
        interval = 30
        timeout = 5
        retries = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    project = var.project_name
    Name    = "${var.project_name}-api-task"
  }
}


