# Use an official Python image as the base
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirement.txt .

# Install dependencies with pip and optimize layer caching
RUN pip install --no-cache-dir -r requirement.txt

# Copy the source code to the container
COPY . .

# Expose the port your app runs on (adjust if necessary)
EXPOSE 8000

# Run the Python application
CMD ["python", "app.py"]
