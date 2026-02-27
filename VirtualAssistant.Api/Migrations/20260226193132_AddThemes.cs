using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VirtualAssistant.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddThemes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Themes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsBuiltIn = table.Column<bool>(type: "boolean", nullable: false),
                    IsDark = table.Column<bool>(type: "boolean", nullable: false),
                    Primary = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PrimaryDark = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PrimaryLight = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SidebarBg = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SidebarActive = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SidebarHover = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SidebarText = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SidebarSubtext = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SidebarBorder = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PageBg = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CardBg = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TextPrimary = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TextMuted = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    BorderColor = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TableHeaderBg = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    InputBg = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Themes", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Themes_Slug",
                table: "Themes",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "Themes");
        }
    }
}
