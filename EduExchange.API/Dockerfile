# Use the official Microsoft .NET SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy the csproj file and restore dependencies
COPY ["EduExchange.API.csproj", "./"]
RUN dotnet restore "./EduExchange.API.csproj"

# Copy the rest of the code and build it
COPY . .
RUN dotnet publish "EduExchange.API.csproj" -c Release -o /app/publish

# Use the lightweight ASP.NET runtime image for production
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Expose the port Render expects (ASP.NET 8+ defaults to port 8080)
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "EduExchange.API.dll"]