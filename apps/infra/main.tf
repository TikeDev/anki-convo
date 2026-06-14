terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ─── KEY PAIR ───────────────────────────────────────────────────────────────

resource "tls_private_key" "anki_mcp" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "anki_mcp" {
  key_name   = "anki-mcp-key"
  public_key = tls_private_key.anki_mcp.public_key_openssh
}

# Save private key locally so provisioners can SSH in
resource "local_file" "private_key" {
  content         = tls_private_key.anki_mcp.private_key_pem
  filename        = "${path.module}/anki-mcp-key.pem"
  file_permission = "0600"
}

# ─── SECURITY GROUP ─────────────────────────────────────────────────────────

resource "aws_security_group" "anki_mcp" {
  name        = "anki-mcp-sg"
  description = "Allow SSH and MCP port access"

  # SSH for provisioners
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # MCP server port
  ingress {
    from_port   = 3141
    to_port     = 3141
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ip]
  }

  # All outbound (needed for Docker pulls, AnkiWeb sync)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "anki-mcp-sg"
  }
}

# ─── EC2 INSTANCE ───────────────────────────────────────────────────────────

# Latest Ubuntu 24.04 LTS AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "anki_mcp" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.anki_mcp.key_name
  vpc_security_group_ids = [aws_security_group.anki_mcp.id]

  # Pass credentials and profile name as env vars for user_data.sh
  user_data = templatefile("${path.module}/user_data.sh", {
    anki_sync_user    = var.anki_sync_user
    anki_sync_key     = var.anki_sync_key
    anki_profile_name = var.anki_profile_name
    ngrok_auth_token  = var.ngrok_auth_token
  })

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name = "anki-mcp-server"
  }
}
