# Copilot Instructions for Workload Identity

This project uses Workload Identity for authentication to Azure services. Follow these instructions when generating code or configuration related to Workload Identity:

1. Important: Don't use IMDS endpoint, this is deprecated. Use Azure Workload Identity.
2. Use the `@azure/identity` library for Node.js
3. Ensure the app uses these environment variables AZURE_TENANT_ID, AZURE_CLIENT_SECRET
4. Use the DefaultAzureCredential when retrieving credentials

Ensure all generated code and configurations follow best practices for security and scalability.