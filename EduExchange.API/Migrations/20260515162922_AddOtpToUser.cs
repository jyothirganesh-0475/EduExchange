using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduExchange.API.Migrations
{
    /// <inheritdoc />
    public partial class AddOtpToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OtpToken",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "OtpTokenExpires",
                table: "Users",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OtpToken",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "OtpTokenExpires",
                table: "Users");
        }
    }
}
