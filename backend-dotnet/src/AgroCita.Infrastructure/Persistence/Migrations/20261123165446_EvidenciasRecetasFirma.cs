using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AgroCita.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EvidenciasRecetasFirma : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "FechaFirma",
                table: "Visita",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "FechaSeguimiento",
                table: "Visita",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FirmaArchivo",
                table: "Visita",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "FirmaLatitud",
                table: "Visita",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "FirmaLongitud",
                table: "Visita",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FirmadoPor",
                table: "Visita",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "EvidenciaVisita",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EmpresaId = table.Column<int>(type: "integer", nullable: false),
                    VisitaId = table.Column<int>(type: "integer", nullable: false),
                    CultivoId = table.Column<int>(type: "integer", nullable: true),
                    UsuarioId = table.Column<int>(type: "integer", nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    Archivo = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TamanoBytes = table.Column<long>(type: "bigint", nullable: false),
                    Latitud = table.Column<double>(type: "double precision", nullable: true),
                    Longitud = table.Column<double>(type: "double precision", nullable: true),
                    PrecisionMetros = table.Column<double>(type: "double precision", nullable: true),
                    FechaCaptura = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EvidenciaVisita", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EvidenciaVisita_Cultivo_CultivoId",
                        column: x => x.CultivoId,
                        principalTable: "Cultivo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EvidenciaVisita_Empresa_EmpresaId",
                        column: x => x.EmpresaId,
                        principalTable: "Empresa",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EvidenciaVisita_Usuario_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EvidenciaVisita_Visita_VisitaId",
                        column: x => x.VisitaId,
                        principalTable: "Visita",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RecetaManejo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EmpresaId = table.Column<int>(type: "integer", nullable: false),
                    VisitaId = table.Column<int>(type: "integer", nullable: false),
                    CultivoId = table.Column<int>(type: "integer", nullable: false),
                    Producto = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    TipoProducto = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Dosis = table.Column<decimal>(type: "numeric(10,3)", precision: 10, scale: 3, nullable: false),
                    Unidad = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    MetodoAplicacion = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    FechaAplicacion = table.Column<DateOnly>(type: "date", nullable: false),
                    Indicaciones = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Estado = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    FechaAplicacionReal = table.Column<DateOnly>(type: "date", nullable: true),
                    ComentarioSeguimiento = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FechaRegistroSeguimiento = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UsuarioSeguimientoId = table.Column<int>(type: "integer", nullable: true),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecetaManejo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RecetaManejo_Cultivo_CultivoId",
                        column: x => x.CultivoId,
                        principalTable: "Cultivo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RecetaManejo_Empresa_EmpresaId",
                        column: x => x.EmpresaId,
                        principalTable: "Empresa",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RecetaManejo_Usuario_UsuarioSeguimientoId",
                        column: x => x.UsuarioSeguimientoId,
                        principalTable: "Usuario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RecetaManejo_Visita_VisitaId",
                        column: x => x.VisitaId,
                        principalTable: "Visita",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EvidenciaVisita_CultivoId",
                table: "EvidenciaVisita",
                column: "CultivoId");

            migrationBuilder.CreateIndex(
                name: "IX_EvidenciaVisita_EmpresaId",
                table: "EvidenciaVisita",
                column: "EmpresaId");

            migrationBuilder.CreateIndex(
                name: "IX_EvidenciaVisita_UsuarioId",
                table: "EvidenciaVisita",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_EvidenciaVisita_VisitaId_FechaCaptura",
                table: "EvidenciaVisita",
                columns: new[] { "VisitaId", "FechaCaptura" });

            migrationBuilder.CreateIndex(
                name: "IX_RecetaManejo_CultivoId_FechaAplicacion",
                table: "RecetaManejo",
                columns: new[] { "CultivoId", "FechaAplicacion" });

            migrationBuilder.CreateIndex(
                name: "IX_RecetaManejo_EmpresaId_Estado_FechaAplicacion",
                table: "RecetaManejo",
                columns: new[] { "EmpresaId", "Estado", "FechaAplicacion" });

            migrationBuilder.CreateIndex(
                name: "IX_RecetaManejo_UsuarioSeguimientoId",
                table: "RecetaManejo",
                column: "UsuarioSeguimientoId");

            migrationBuilder.CreateIndex(
                name: "IX_RecetaManejo_VisitaId",
                table: "RecetaManejo",
                column: "VisitaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EvidenciaVisita");

            migrationBuilder.DropTable(
                name: "RecetaManejo");

            migrationBuilder.DropColumn(
                name: "FechaFirma",
                table: "Visita");

            migrationBuilder.DropColumn(
                name: "FechaSeguimiento",
                table: "Visita");

            migrationBuilder.DropColumn(
                name: "FirmaArchivo",
                table: "Visita");

            migrationBuilder.DropColumn(
                name: "FirmaLatitud",
                table: "Visita");

            migrationBuilder.DropColumn(
                name: "FirmaLongitud",
                table: "Visita");

            migrationBuilder.DropColumn(
                name: "FirmadoPor",
                table: "Visita");
        }
    }
}
