using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AgroCita.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InventarioAuditoriaLogo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "InsumoId",
                table: "RecetaManejo",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LogoArchivo",
                table: "Empresa",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LogoContentType",
                table: "Empresa",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Auditoria",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EmpresaId = table.Column<int>(type: "integer", nullable: true),
                    UsuarioId = table.Column<int>(type: "integer", nullable: true),
                    Rol = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Entidad = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    EntidadId = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    Accion = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Cambios = table.Column<string>(type: "jsonb", nullable: false),
                    Fecha = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Auditoria", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Auditoria_Empresa_EmpresaId",
                        column: x => x.EmpresaId,
                        principalTable: "Empresa",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Auditoria_Usuario_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Insumo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EmpresaId = table.Column<int>(type: "integer", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Tipo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Unidad = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Presentacion = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    Stock = table.Column<decimal>(type: "numeric(12,3)", precision: 12, scale: 3, nullable: false),
                    StockMinimo = table.Column<decimal>(type: "numeric(12,3)", precision: 12, scale: 3, nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Insumo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Insumo_Empresa_EmpresaId",
                        column: x => x.EmpresaId,
                        principalTable: "Empresa",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MovimientoInsumo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EmpresaId = table.Column<int>(type: "integer", nullable: false),
                    InsumoId = table.Column<int>(type: "integer", nullable: false),
                    Tipo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Cantidad = table.Column<decimal>(type: "numeric(12,3)", precision: 12, scale: 3, nullable: false),
                    StockResultante = table.Column<decimal>(type: "numeric(12,3)", precision: 12, scale: 3, nullable: false),
                    ProductorId = table.Column<int>(type: "integer", nullable: true),
                    RecetaId = table.Column<int>(type: "integer", nullable: true),
                    Nota = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    Fecha = table.Column<DateOnly>(type: "date", nullable: false),
                    UsuarioId = table.Column<int>(type: "integer", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovimientoInsumo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MovimientoInsumo_Empresa_EmpresaId",
                        column: x => x.EmpresaId,
                        principalTable: "Empresa",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MovimientoInsumo_Insumo_InsumoId",
                        column: x => x.InsumoId,
                        principalTable: "Insumo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MovimientoInsumo_Productor_ProductorId",
                        column: x => x.ProductorId,
                        principalTable: "Productor",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MovimientoInsumo_RecetaManejo_RecetaId",
                        column: x => x.RecetaId,
                        principalTable: "RecetaManejo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MovimientoInsumo_Usuario_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RecetaManejo_InsumoId",
                table: "RecetaManejo",
                column: "InsumoId");

            migrationBuilder.CreateIndex(
                name: "IX_Auditoria_EmpresaId_Entidad_EntidadId",
                table: "Auditoria",
                columns: new[] { "EmpresaId", "Entidad", "EntidadId" });

            migrationBuilder.CreateIndex(
                name: "IX_Auditoria_EmpresaId_Fecha",
                table: "Auditoria",
                columns: new[] { "EmpresaId", "Fecha" });

            migrationBuilder.CreateIndex(
                name: "IX_Auditoria_UsuarioId",
                table: "Auditoria",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Insumo_EmpresaId_Nombre",
                table: "Insumo",
                columns: new[] { "EmpresaId", "Nombre" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MovimientoInsumo_EmpresaId",
                table: "MovimientoInsumo",
                column: "EmpresaId");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientoInsumo_InsumoId_Fecha",
                table: "MovimientoInsumo",
                columns: new[] { "InsumoId", "Fecha" });

            migrationBuilder.CreateIndex(
                name: "IX_MovimientoInsumo_ProductorId_Fecha",
                table: "MovimientoInsumo",
                columns: new[] { "ProductorId", "Fecha" });

            migrationBuilder.CreateIndex(
                name: "IX_MovimientoInsumo_RecetaId",
                table: "MovimientoInsumo",
                column: "RecetaId");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientoInsumo_UsuarioId",
                table: "MovimientoInsumo",
                column: "UsuarioId");

            migrationBuilder.AddForeignKey(
                name: "FK_RecetaManejo_Insumo_InsumoId",
                table: "RecetaManejo",
                column: "InsumoId",
                principalTable: "Insumo",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RecetaManejo_Insumo_InsumoId",
                table: "RecetaManejo");

            migrationBuilder.DropTable(
                name: "Auditoria");

            migrationBuilder.DropTable(
                name: "MovimientoInsumo");

            migrationBuilder.DropTable(
                name: "Insumo");

            migrationBuilder.DropIndex(
                name: "IX_RecetaManejo_InsumoId",
                table: "RecetaManejo");

            migrationBuilder.DropColumn(
                name: "InsumoId",
                table: "RecetaManejo");

            migrationBuilder.DropColumn(
                name: "LogoArchivo",
                table: "Empresa");

            migrationBuilder.DropColumn(
                name: "LogoContentType",
                table: "Empresa");
        }
    }
}
