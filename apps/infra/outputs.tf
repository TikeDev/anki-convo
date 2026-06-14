output "instance_public_ip" {
  description = "Public IP of the anki-mcp EC2 instance"
  value       = aws_instance.anki_mcp.public_ip
}

output "mcp_endpoint" {
  description = "MCP server endpoint to paste into Claude.ai connector"
  value       = "http://${aws_instance.anki_mcp.public_ip}:3141"
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i anki-mcp-key.pem ubuntu@${aws_instance.anki_mcp.public_ip}"
}

output "get_mcp_url" {
  description = "Command to get your ngrok MCP URL after deploy"
  value       = "ssh -i anki-mcp-key.pem ubuntu@${aws_instance.anki_mcp.public_ip} cat /opt/ngrok-url.txt"
}
