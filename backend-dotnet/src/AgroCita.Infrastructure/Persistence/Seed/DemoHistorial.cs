using AgroCita.Application.Common.Interfaces;
using AgroCita.Domain.Constants;
using AgroCita.Domain.Entities;
using AgroCita.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AgroCita.Infrastructure.Persistence.Seed;

internal static class DemoHistorial
{
    private const string FirmaPng = "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";

    public static async Task SembrarAsync(
        AgroCitaDbContext db, IPasswordHashService hash, IFileStorage almacenamiento, int empresaId)
    {
        var hoy = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(-6));

        var admin = await db.Users.IgnoreQueryFilters()
            .FirstAsync(u => u.EmpresaId == empresaId && u.RolId == Roles.AdminEmpresaId);
        var carlos = await db.Technicians.IgnoreQueryFilters().Include(t => t.Usuario)
            .FirstAsync(t => t.EmpresaId == empresaId);
        var maria = await db.Producers.IgnoreQueryFilters().Include(p => p.Usuario)
            .Include(p => p.Fincas).ThenInclude(f => f.Cultivos)
            .FirstAsync(p => p.EmpresaId == empresaId);
        var tipos = await db.CropTypes.IgnoreQueryFilters()
            .Where(t => t.EmpresaId == empresaId).ToDictionaryAsync(t => t.Nombre);
        var parametros = await db.EvaluationParameters.IgnoreQueryFilters()
            .Where(p => p.EmpresaId == empresaId).ToDictionaryAsync(p => p.Nombre);
        var categorias = await db.QualityCategories.IgnoreQueryFilters()
            .Where(c => c.EmpresaId == empresaId).ToDictionaryAsync(c => c.Nombre);
        var fertilizantes = await db.Fertilizers.IgnoreQueryFilters()
            .Where(f => f.EmpresaId == empresaId).ToDictionaryAsync(f => f.Nombre);

        var paraiso = maria.Fincas.First();
        var cafe = paraiso.Cultivos.First(c => c.TipoCultivoId == tipos["Café"].Id);
        var maizParaiso = paraiso.Cultivos.First(c => c.TipoCultivoId == tipos["Maíz"].Id);

        var sofia = new Technician
        {
            EmpresaId = empresaId,
            Especialidad = "Granos básicos",
            Telefono = "97651234",
            Activo = true,
            Usuario = Usuario(hash, empresaId, Roles.TecnicoId, "Sofía", "Martínez", "tecnico2@agroconsulta.hn", "Tecnico123*")
        };

        var frijolRosa = new Crop
        {
            EmpresaId = empresaId,
            TipoCultivo = tipos["Frijol"],
            Nombre = "Frijol rojo de postrera",
            Variedad = "Amadeus 77",
            AreaSembrada = 4,
            FechaSiembra = hoy.AddMonths(-3),
            Activo = true
        };

        var maizRosa = new Crop
        {
            EmpresaId = empresaId,
            TipoCultivo = tipos["Maíz"],
            Nombre = "Maíz blanco",
            Variedad = "Guayape",
            AreaSembrada = 6,
            FechaSiembra = hoy.AddMonths(-4),
            Activo = true
        };

        var santaRosa = new Farm
        {
            EmpresaId = empresaId,
            Nombre = "Finca Santa Rosa",
            Departamento = "Comayagua",
            Municipio = "La Libertad",
            Ubicacion = "Caserío El Rosario, desvío a San Jerónimo",
            AreaManzanas = 15,
            Descripcion = "Granos básicos con riego por goteo",
            Cultivos = [frijolRosa, maizRosa]
        };

        var jose = new Producer
        {
            EmpresaId = empresaId,
            Dni = "0301198507654",
            Telefono = "95123478",
            Direccion = "Barrio Abajo, La Libertad, Comayagua",
            Usuario = Usuario(hash, empresaId, Roles.ProductorId, "José", "Hernández", "productor2@agroconsulta.hn", "Productor123*"),
            Fincas = [santaRosa]
        };

        db.Technicians.Add(sofia);
        db.Producers.Add(jose);

        var oxicloruro = Insumo(empresaId, "Oxicloruro de cobre 50%", ProductType.Fungicida, "kg", "Bolsa de 1 kg", 18, 5);
        var urea = Insumo(empresaId, "Urea 46%", ProductType.Fertilizante, "qq", "Saco de 100 lb", 12, 10);
        var cipermetrina = Insumo(empresaId, "Cipermetrina 25 EC", ProductType.Insecticida, "L", "Frasco de 1 L", 3, 4);
        var trichoderma = Insumo(empresaId, "Trichoderma harzianum", ProductType.Bioinsumo, "kg", "Bolsa de 500 g", 10, 2);
        db.Supplies.AddRange(oxicloruro, urea, cipermetrina, trichoderma);

        await db.SaveChangesAsync();

        foreach (var (insumo, cantidad) in new[] { (oxicloruro, 20m), (urea, 25m), (cipermetrina, 5m), (trichoderma, 10m) })
        {
            db.SupplyMovements.Add(new SupplyMovement
            {
                EmpresaId = empresaId,
                Insumo = insumo,
                Tipo = MovementType.Entrada,
                Cantidad = cantidad,
                StockResultante = cantidad,
                Nota = "Compra inicial de temporada",
                Fecha = hoy.AddDays(-130),
                UsuarioId = admin.Id,
                FechaRegistro = Utc(hoy.AddDays(-130), 15)
            });
        }

        var firma = await GuardarFirmaAsync(almacenamiento);

        var s1 = Solicitud(empresaId, paraiso, [cafe], "Manchas anaranjadas en el envés de las hojas del cafetal; sospecha de roya.",
            hoy.AddDays(-120), hoy.AddDays(-110), AssistanceRequestStatus.Atendida);
        var v1 = Visita(empresaId, s1, carlos, hoy.AddDays(-112), 9, VisitStatus.Completada, creadaDiasDespues: 1);
        Cerrar(v1, firma, "María López", 14.0805, -87.0412);
        v1.Informe = Informe(empresaId, v1,
            "Se recorrió el lote 1 completo. Se observan pústulas de roya en el tercio inferior de las plantas.",
            "Roya del cafeto (Hemileia vastatrix) con incidencia moderada, favorecida por sombra densa y humedad.",
            "Aplicar fungicida cúprico, regular la sombra y fertilizar con nitrógeno para recuperar follaje.");
        v1.Inspecciones.Add(Inspeccion(empresaId, v1, cafe, categorias["Grado B"], "Grano con buena densidad pero follaje afectado.",
            (parametros["Humedad del grano"], "11.8"), (parametros["Incidencia de roya"], "18")));
        var r1 = Receta(empresaId, v1, cafe, oxicloruro, "Oxicloruro de cobre 50%", ProductType.Fungicida, 2.5m, "kg/mz",
            "Aspersión foliar", hoy.AddDays(-105), "Aplicar en horas frescas, cubriendo el envés de las hojas.",
            PrescriptionStatus.Aplicada, hoy.AddDays(-104), "Aplicado en todo el lote, sin lluvia en 24 h.", maria.UsuarioId);
        v1.Recetas.Add(r1);
        var rec1 = new FertilizationRecommendation
        {
            EmpresaId = empresaId, Visita = v1, Cultivo = cafe, Fertilizante = fertilizantes["Urea 46%"],
            DosisRecomendada = 2, Frecuencia = "Cada 45 días", Indicaciones = "Aplicar en media luna alrededor de la planta.",
            FechaRecomendacion = hoy.AddDays(-112)
        };
        db.FertilizationRecommendations.Add(rec1);
        db.FertilizerApplications.Add(new FertilizerApplication
        {
            EmpresaId = empresaId, Cultivo = cafe, Fertilizante = fertilizantes["Urea 46%"], Recomendacion = rec1,
            Tecnico = carlos, CantidadAplicada = 16, FechaAplicacion = hoy.AddDays(-100),
            Observaciones = "Aplicación completa en las 8 manzanas."
        });

        var s2 = Solicitud(empresaId, paraiso, [maizParaiso], "El maíz de primera tiene hojas amarillas desde la base.",
            hoy.AddDays(-75), hoy.AddDays(-68), AssistanceRequestStatus.Atendida);
        var v2 = Visita(empresaId, s2, carlos, hoy.AddDays(-70), 10, VisitStatus.Completada, creadaDiasDespues: 2);
        v2.Reprogramaciones.Add(new VisitReschedule
        {
            EmpresaId = empresaId, Visita = v2, UsuarioId = admin.Id,
            FechaAnterior = Utc(hoy.AddDays(-72), 15), FechaNueva = v2.FechaProgramada,
            Motivo = "Lluvias fuertes impidieron el acceso a la finca.", FechaRegistro = Utc(hoy.AddDays(-73), 20)
        });
        Cerrar(v2, firma, "María López", 14.0811, -87.0398);
        v2.Informe = Informe(empresaId, v2,
            "Plantas de 45 días con clorosis en hojas bajeras. Suelo franco arcilloso con buen drenaje.",
            "Deficiencia de nitrógeno por lavado tras las lluvias.",
            "Aplicar urea en banda y repetir a los 20 días. Monitorear gusano cogollero.");
        v2.Inspecciones.Add(Inspeccion(empresaId, v2, maizParaiso, categorias["Primera selección"], "Buen vigor general.",
            (parametros["Altura de planta"], "165")));
        var r2 = Receta(empresaId, v2, maizParaiso, urea, "Urea 46%", ProductType.Fertilizante, 2, "qq/mz",
            "Al suelo, en banda", hoy.AddDays(-66), "Incorporar con humedad en el suelo.",
            PrescriptionStatus.Aplicada, hoy.AddDays(-65), "Aplicada según lo indicado.", maria.UsuarioId);
        v2.Recetas.Add(r2);

        var s3 = Solicitud(empresaId, santaRosa, [frijolRosa], "Presencia de mosca blanca en el frijol y vainas deformes.",
            hoy.AddDays(-45), hoy.AddDays(-40), AssistanceRequestStatus.Atendida);
        var v3 = Visita(empresaId, s3, sofia, hoy.AddDays(-38), 8, VisitStatus.Completada, creadaDiasDespues: 3);
        Cerrar(v3, firma, "José Hernández", 14.6052, -87.6011);
        v3.Informe = Informe(empresaId, v3,
            "Colonias de mosca blanca en el envés y algunas plantas con mosaico dorado.",
            "Mosaico dorado transmitido por mosca blanca (Bemisia tabaci).",
            "Control químico focalizado, eliminar plantas con virus y colocar trampas amarillas.");
        v3.Inspecciones.Add(Inspeccion(empresaId, v3, frijolRosa, categorias["Segunda selección"], "Daño visible en 20 % de las plantas.",
            (parametros["Vainas por planta"], "11")));
        var r3 = Receta(empresaId, v3, frijolRosa, cipermetrina, "Cipermetrina 25 EC", ProductType.Insecticida, 0.5m, "L/mz",
            "Aspersión foliar", hoy.AddDays(-20), "Usar equipo de protección y respetar 14 días antes de cosecha.",
            PrescriptionStatus.Pendiente, null, null, null);
        v3.Recetas.Add(r3);

        var s4 = Solicitud(empresaId, santaRosa, [maizRosa], "Revisión de desarrollo del maíz antes de la segunda fertilización.",
            hoy.AddDays(-20), hoy.AddDays(-14), AssistanceRequestStatus.Atendida);
        var v4 = Visita(empresaId, s4, sofia, hoy.AddDays(-15), 9, VisitStatus.Completada, creadaDiasDespues: 1);
        Cerrar(v4, firma, "José Hernández", 14.6049, -87.6020);
        v4.Informe = Informe(empresaId, v4,
            "Cultivo uniforme en etapa V8. Sin plagas de importancia económica.",
            "Desarrollo normal del cultivo.",
            "Aplicar Trichoderma al suelo para prevenir pudriciones y mantener riego.");
        v4.Inspecciones.Add(Inspeccion(empresaId, v4, maizRosa, categorias["Grado A"], "Excelente estado.",
            (parametros["Altura de planta"], "190")));
        var r4 = Receta(empresaId, v4, maizRosa, trichoderma, "Trichoderma harzianum", ProductType.Bioinsumo, 1, "kg/mz",
            "Al suelo con el riego", hoy.AddDays(-10), "Aplicar al atardecer.",
            PrescriptionStatus.NoAplicada, null, "El productor no consiguió el producto a tiempo.", jose.UsuarioId);
        v4.Recetas.Add(r4);

        var s5 = Solicitud(empresaId, santaRosa, [frijolRosa], "Solicito visita para evaluar la cosecha del frijol.",
            hoy.AddDays(-30), hoy.AddDays(-25), AssistanceRequestStatus.Rechazada);
        s5.ComentarioEstado = "Ya existe una visita de seguimiento para este cultivo.";

        var s6 = Solicitud(empresaId, paraiso, [cafe], "Seguimiento al control de roya y evaluación de la floración.",
            hoy.AddDays(-8), hoy.AddDays(3), AssistanceRequestStatus.EnAtencion);
        var v6c = Visita(empresaId, s6, sofia, hoy.AddDays(-2), 9, VisitStatus.Cancelada, creadaDiasDespues: 1);
        v6c.MotivoCancelacion = "Se reasignó al técnico especialista en café.";
        Visita(empresaId, s6, carlos, hoy.AddDays(2), 8, VisitStatus.Confirmada, creadaDiasDespues: 3);

        var s7 = Solicitud(empresaId, santaRosa, [maizRosa, frijolRosa], "Revisión general antes de la siembra de postrera.",
            hoy.AddDays(-4), hoy.AddDays(1), AssistanceRequestStatus.EnAtencion);
        Visita(empresaId, s7, sofia, hoy, 16, VisitStatus.Pendiente, creadaDiasDespues: 1);

        db.AssistanceRequests.AddRange(s1, s2, s3, s4, s5, s6, s7);
        await db.SaveChangesAsync();

        Entrega(db, empresaId, admin.Id, oxicloruro, r1, maria.Id, 20m, 18m, hoy.AddDays(-110));
        Entrega(db, empresaId, admin.Id, urea, r2, maria.Id, 25m, 12m, hoy.AddDays(-68));
        Entrega(db, empresaId, admin.Id, cipermetrina, r3, jose.Id, 5m, 3m, hoy.AddDays(-36));

        await db.SaveChangesAsync();
    }

    private static async Task<string> GuardarFirmaAsync(IFileStorage almacenamiento)
    {
        using var contenido = new MemoryStream(Convert.FromBase64String(FirmaPng));
        return await almacenamiento.GuardarAsync(contenido, "firmas", "png", CancellationToken.None);
    }

    private static DateTime Utc(DateOnly fecha, int horaLocal) =>
        DateTime.SpecifyKind(fecha.ToDateTime(new TimeOnly(horaLocal, 0)).AddHours(6), DateTimeKind.Utc);

    private static AssistanceRequest Solicitud(
        int empresaId, Farm finca, Crop[] cultivos, string motivo,
        DateOnly creada, DateOnly deseada, AssistanceRequestStatus estado) => new()
    {
        EmpresaId = empresaId,
        Finca = finca,
        Motivo = motivo,
        FechaDeseada = deseada,
        Estado = estado,
        FechaCreacion = Utc(creada, 8),
        Cultivos = cultivos.Select(c => new AssistanceRequestCrop { EmpresaId = empresaId, Cultivo = c }).ToList()
    };

    private static Visit Visita(
        int empresaId, AssistanceRequest solicitud, Technician tecnico, DateOnly fecha, int hora,
        VisitStatus estado, int creadaDiasDespues)
    {
        var visita = new Visit
        {
            EmpresaId = empresaId,
            Solicitud = solicitud,
            Tecnico = tecnico,
            FechaProgramada = Utc(fecha, hora),
            Estado = estado,
            FechaCreacion = solicitud.FechaCreacion.AddDays(creadaDiasDespues)
        };

        solicitud.Visitas.Add(visita);
        return visita;
    }

    private static void Cerrar(Visit visita, string firma, string firmadoPor, double latitud, double longitud)
    {
        visita.FirmaArchivo = firma;
        visita.FirmadoPor = firmadoPor;
        visita.FechaFirma = visita.FechaProgramada.AddHours(2);
        visita.FirmaLatitud = latitud;
        visita.FirmaLongitud = longitud;
    }

    private static Report Informe(int empresaId, Visit visita, string observaciones, string diagnostico, string recomendaciones) => new()
    {
        EmpresaId = empresaId,
        Visita = visita,
        Observaciones = observaciones,
        Diagnostico = diagnostico,
        Recomendaciones = recomendaciones,
        FechaElaboracion = visita.FechaProgramada.AddHours(3)
    };

    private static Inspection Inspeccion(
        int empresaId, Visit visita, Crop cultivo, QualityCategory categoria, string observaciones,
        params (EvaluationParameter Parametro, string Valor)[] resultados) => new()
    {
        EmpresaId = empresaId,
        Visita = visita,
        Cultivo = cultivo,
        CategoriaCalidad = categoria,
        FechaInspeccion = visita.FechaProgramada.AddHours(1),
        Observaciones = observaciones,
        Resultados = resultados.Select(r => new ParameterResult
        {
            EmpresaId = empresaId,
            ParametroEvaluacion = r.Parametro,
            Valor = r.Valor
        }).ToList()
    };

    private static Prescription Receta(
        int empresaId, Visit visita, Crop cultivo, Supply insumo, string producto, ProductType tipo,
        decimal dosis, string unidad, string metodo, DateOnly fechaAplicacion, string indicaciones,
        PrescriptionStatus estado, DateOnly? fechaReal, string? comentario, int? usuarioSeguimientoId) => new()
    {
        EmpresaId = empresaId,
        Visita = visita,
        Cultivo = cultivo,
        Insumo = insumo,
        Producto = producto,
        TipoProducto = tipo,
        Dosis = dosis,
        Unidad = unidad,
        MetodoAplicacion = metodo,
        FechaAplicacion = fechaAplicacion,
        Indicaciones = indicaciones,
        Estado = estado,
        FechaAplicacionReal = fechaReal,
        ComentarioSeguimiento = comentario,
        FechaRegistroSeguimiento = comentario is null ? null : Utc(fechaReal ?? fechaAplicacion, 17),
        UsuarioSeguimientoId = comentario is null ? null : usuarioSeguimientoId,
        FechaCreacion = visita.FechaProgramada.AddHours(3)
    };

    private static Supply Insumo(
        int empresaId, string nombre, ProductType tipo, string unidad, string presentacion,
        decimal stock, decimal minimo) => new()
    {
        EmpresaId = empresaId,
        Nombre = nombre,
        Tipo = tipo,
        Unidad = unidad,
        Presentacion = presentacion,
        Stock = stock,
        StockMinimo = minimo,
        Activo = true,
        FechaCreacion = DateTime.UtcNow
    };

    private static void Entrega(
        AgroCitaDbContext db, int empresaId, int usuarioId, Supply insumo, Prescription receta,
        int productorId, decimal antes, decimal despues, DateOnly fecha)
    {
        db.SupplyMovements.Add(new SupplyMovement
        {
            EmpresaId = empresaId,
            Insumo = insumo,
            Tipo = MovementType.Entrega,
            Cantidad = antes - despues,
            StockResultante = despues,
            ProductorId = productorId,
            Receta = receta,
            Nota = $"Entrega para la receta de {receta.Producto}",
            Fecha = fecha,
            UsuarioId = usuarioId,
            FechaRegistro = Utc(fecha, 11)
        });
    }

    private static User Usuario(
        IPasswordHashService hash, int empresaId, int rolId,
        string nombre, string apellido, string email, string password) => new()
    {
        EmpresaId = empresaId,
        RolId = rolId,
        Nombre = nombre,
        Apellido = apellido,
        Email = email,
        PasswordHash = hash.HashPassword(password),
        Activo = true,
        FechaCreacion = DateTime.UtcNow
    };
}
