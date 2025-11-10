# stop anything already using 5678 if needed
docker ps
docker stop <id>   # if you see an old n8n container using 5678

# run n8n; persist data so workflows don’t disappear
docker run -it --name n8n \
  -p 127.0.0.1:5678:5678 \               # bind only to localhost on the host
  -e N8N_HOST=localhost \
  -e N8N_PORT=5678 \
  -e N8N_PROTOCOL=http \
  -e N8N_DIAGNOSTICS_ENABLED=false \
  -v $HOME/.n8n:/home/node/.n8n \        # PERSIST WORKFLOWS & CREDENTIALS
  n8nio/n8n:latest
