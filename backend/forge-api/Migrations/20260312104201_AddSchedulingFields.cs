using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ForgeApi.Migrations
{
    /// <inheritdoc />
    public partial class AddSchedulingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsRecurring",
                table: "PayoutBatches",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "NextRunAt",
                table: "PayoutBatches",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentType",
                table: "PayoutBatches",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "immediate");

            migrationBuilder.AddColumn<string>(
                name: "RecurringInterval",
                table: "PayoutBatches",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ScheduledAt",
                table: "PayoutBatches",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsRecurring",
                table: "PayoutBatches");

            migrationBuilder.DropColumn(
                name: "NextRunAt",
                table: "PayoutBatches");

            migrationBuilder.DropColumn(
                name: "PaymentType",
                table: "PayoutBatches");

            migrationBuilder.DropColumn(
                name: "RecurringInterval",
                table: "PayoutBatches");

            migrationBuilder.DropColumn(
                name: "ScheduledAt",
                table: "PayoutBatches");
        }
    }
}
