variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "anki_sync_user" {
  description = "AnkiWeb email address"
  type        = string
  sensitive   = true
}

variable "anki_sync_key" {
  description = "AnkiWeb sync token extracted from prefs21.db"
  type        = string
  sensitive   = true
}

variable "anki_profile_name" {
  description = "Anki profile name (usually 'User 1')"
  type        = string
  default     = "User 1"
}

variable "allowed_ip" {
  description = "Your IP address to restrict MCP port access (use 0.0.0.0/0 to allow all)"
  type        = string
  default     = "0.0.0.0/0"
}

variable "ngrok_auth_token" {
  description = "ngrok auth token for HTTPS tunnel (get from dashboard.ngrok.com)"
  type        = string
  sensitive   = true
}

variable "ngrok_domain" {
  description = "Stable ngrok HTTPS domain, e.g. https://abc.ngrok-free.app"
  type        = string

  validation {
    condition     = startswith(var.ngrok_domain, "https://")
    error_message = "ngrok_domain must start with https://"
  }
}