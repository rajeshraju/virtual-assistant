using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VirtualAssistant.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    FirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PhoneNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Appointments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    ContactName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ContactEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ContactPhone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    StartTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ReminderSentSms = table.Column<bool>(type: "boolean", nullable: false),
                    ReminderSentEmail = table.Column<bool>(type: "boolean", nullable: false),
                    ReminderMinutesBefore = table.Column<int>(type: "integer", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Appointments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Appointments_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EmailRules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    MatchField = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    MatchOperator = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    MatchValue = table.Column<string>(type: "text", nullable: false),
                    ReplyTemplate = table.Column<string>(type: "text", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailRules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmailRules_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PhoneCalls",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    TwilioCallSid = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    From = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    To = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Direction = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Duration = table.Column<int>(type: "integer", nullable: true),
                    RecordingUrl = table.Column<string>(type: "text", nullable: true),
                    TranscriptionText = table.Column<string>(type: "text", nullable: true),
                    AppointmentId = table.Column<Guid>(type: "uuid", nullable: true),
                    CallStartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PhoneCalls", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PhoneCalls_Appointments_AppointmentId",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PhoneCalls_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ReminderLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AppointmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    Channel = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    SentTo = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReminderLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReminderLogs_Appointments_AppointmentId",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SmsMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TwilioMessageSid = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    From = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    To = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Body = table.Column<string>(type: "text", nullable: false),
                    Direction = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AppointmentId = table.Column<Guid>(type: "uuid", nullable: true),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SmsMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SmsMessages_Appointments_AppointmentId",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "EmailLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    MessageId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    From = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    To = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Subject = table.Column<string>(type: "text", nullable: false),
                    BodySnippet = table.Column<string>(type: "text", nullable: true),
                    ReceivedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RuleMatchedId = table.Column<Guid>(type: "uuid", nullable: true),
                    AutoReplySent = table.Column<bool>(type: "boolean", nullable: false),
                    AutoReplyAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmailLogs_EmailRules_RuleMatchedId",
                        column: x => x.RuleMatchedId,
                        principalTable: "EmailRules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_EmailLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_UserId",
                table: "Appointments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_EmailLogs_MessageId",
                table: "EmailLogs",
                column: "MessageId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EmailLogs_RuleMatchedId",
                table: "EmailLogs",
                column: "RuleMatchedId");

            migrationBuilder.CreateIndex(
                name: "IX_EmailLogs_UserId",
                table: "EmailLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_EmailRules_UserId",
                table: "EmailRules",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PhoneCalls_AppointmentId",
                table: "PhoneCalls",
                column: "AppointmentId");

            migrationBuilder.CreateIndex(
                name: "IX_PhoneCalls_TwilioCallSid",
                table: "PhoneCalls",
                column: "TwilioCallSid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PhoneCalls_UserId",
                table: "PhoneCalls",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ReminderLogs_AppointmentId",
                table: "ReminderLogs",
                column: "AppointmentId");

            migrationBuilder.CreateIndex(
                name: "IX_SmsMessages_AppointmentId",
                table: "SmsMessages",
                column: "AppointmentId");

            migrationBuilder.CreateIndex(
                name: "IX_SmsMessages_TwilioMessageSid",
                table: "SmsMessages",
                column: "TwilioMessageSid",
                unique: true,
                filter: "\"TwilioMessageSid\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EmailLogs");

            migrationBuilder.DropTable(
                name: "PhoneCalls");

            migrationBuilder.DropTable(
                name: "ReminderLogs");

            migrationBuilder.DropTable(
                name: "SmsMessages");

            migrationBuilder.DropTable(
                name: "EmailRules");

            migrationBuilder.DropTable(
                name: "Appointments");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
