resource "aws_lb_target_group" "api" {
  name        = "${var.project_name}-api-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  deregistration_delay = 300

  health_check {
    protocol            = "HTTP"
    path                = "/api/v1/health"
    port                = "traffic-port"
    matcher             = "200-299"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }

  tags = {
    project = var.project_name
    Name    = "${var.project_name}-api-tg"
  }
}

resource "aws_lb_listener" "api" {
  load_balancer_arn = var.alb_arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  tags = {
    project = var.project_name
    Name    = "${var.project_name}-api-listener"
  }
}

