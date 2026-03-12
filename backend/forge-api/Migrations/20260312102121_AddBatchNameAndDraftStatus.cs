using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ForgeApi.Migrations
{
    /// <inheritdoc />
    public partial class AddBatchNameAndDraftStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "PayoutBatches",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "draft",
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30,
                oldDefaultValue: "pending");

            migrationBuilder.AddColumn<string>(
                name: "BatchName",
                table: "PayoutBatches",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BatchName",
                table: "PayoutBatches");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "PayoutBatches",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "pending",
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30,
                oldDefaultValue: "draft");
        }
    }
}
