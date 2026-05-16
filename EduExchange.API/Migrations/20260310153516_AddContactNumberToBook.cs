using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduExchange.API.Migrations
{
    /// <inheritdoc />
    public partial class AddContactNumberToBook : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContactNumber",
                table: "Books",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContactNumber",
                table: "Books");
        }
    }
}
