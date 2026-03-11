using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ForgeApi.Migrations
{
    /// <inheritdoc />
    public partial class ApiKeyOrgScope : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ApiKeys_Organizations_OrganizationId",
                table: "ApiKeys");

            migrationBuilder.AlterColumn<Guid>(
                name: "OrganizationId",
                table: "ApiKeys",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Permissions",
                table: "ApiKeys",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "read");

            migrationBuilder.AddForeignKey(
                name: "FK_ApiKeys_Organizations_OrganizationId",
                table: "ApiKeys",
                column: "OrganizationId",
                principalTable: "Organizations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ApiKeys_Organizations_OrganizationId",
                table: "ApiKeys");

            migrationBuilder.DropColumn(
                name: "Permissions",
                table: "ApiKeys");

            migrationBuilder.AlterColumn<Guid>(
                name: "OrganizationId",
                table: "ApiKeys",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddForeignKey(
                name: "FK_ApiKeys_Organizations_OrganizationId",
                table: "ApiKeys",
                column: "OrganizationId",
                principalTable: "Organizations",
                principalColumn: "Id");
        }
    }
}
