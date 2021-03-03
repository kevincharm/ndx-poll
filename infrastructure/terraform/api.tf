resource "digitalocean_container_registry" "ndx_poll_ecr" {
  name = "ndx_poll"

  lifecycle {
    prevent_destroy = true
  }
}

output "ndx_poll_ecr_endpoint" {
  value = digitalocean_container_registry.ndx_poll_ecr.endpoint
}
