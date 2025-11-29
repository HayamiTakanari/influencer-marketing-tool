#!/bin/bash
curl -X POST http://localhost:5002/api/tiktok/video-info \
  -H "Content-Type: application/json" \
  -d '{"videoUrl":"https://www.tiktok.com/@tiktok/video/7231338487075638570"}'
