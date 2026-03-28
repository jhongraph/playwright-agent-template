import { test, expect }  from '@playwright/test';
import {
  TEST_DATA,
  SEL,
  waitForPageIdle,
  setIfBlank,
  safeSetValue,
  clickContinuar,
  waitForClickable,
  logEmptyFields,
  makeScreenshot,
  loginAutoReg,
} from '../fixtures/car-registration-batch.fixture';

// ─── SUITE ───────────────────────────────────────────────────────────────────

test.describe('Registro de Autos Lote — CarRegistrationBatch', () => {

  // ── HAPPY PATH ─────────────────────────────────────────────────────────────

  test('HP-01 | Registro exitoso de auto en lote (happy path)', async ({ page }, testInfo) => {
    const ss = makeScreenshot(page, testInfo);

    // ── Login ──────────────────────────────────────────────────────────────
    await loginAutoReg(page);
    await ss('00-home-after-login');

    // ── Navegar directo a Registro de Autos Lote ──────────────────────────
    await page.goto('/Forms/CarRegistrationBatch.aspx');
    await waitForPageIdle(page);
    await ss('01-car-registration-batch-init');

    // ══════════════════════════════════════════════════════════════════════
    // FORMULARIO 1 — Datos Generales
    // ══════════════════════════════════════════════════════════════════════

    // REGLA 3: Selects primero, luego inputs
    await page.locator(SEL.form1.buyTypeCategory).selectOption(TEST_DATA.buyTypeCategory);
    await waitForPageIdle(page); // AutoPostBack — todos los inputs se resetean

    // JS-RESTRICTED: salePrice tiene formatter, licenseNumber tiene onkeypress+oninput
    await safeSetValue(page, SEL.form1.salePrice,    TEST_DATA.salePrice);
    await safeSetValue(page, SEL.form1.licenseNumber, TEST_DATA.licenseNumber);
    await safeSetValue(page, SEL.form1.vinInput,      TEST_DATA.vin);

    await ss('02-form1-antes-continuar');

    // REGLA 6: diagnóstico (no assert duro)
    await logEmptyFields(page, 'form#form1', ss);
    await clickContinuar(page, SEL.form1.continuar);

    // El sistema consulta datos del dueño — confirmar
    await waitForClickable(page.locator(SEL.form1.confirmOwner), 20_000);
    await page.locator(SEL.form1.confirmOwner).click();
    await waitForPageIdle(page);
    await ss('03-form1-after-confirm-owner');

    // ══════════════════════════════════════════════════════════════════════
    // FORMULARIO 2 — Información del Concesionario
    // ══════════════════════════════════════════════════════════════════════

    // JS-RESTRICTED: dealerLicense tiene onkeypress+oninput
    await safeSetValue(page, SEL.form2.dealerLicense, TEST_DATA.dealerLicense);

    await waitForClickable(page.locator(SEL.form2.searchLicenseBtn));
    await page.locator(SEL.form2.searchLicenseBtn).click();
    await waitForPageIdle(page);

    // Verificar que se cargaron datos del concesionario
    await expect(page.locator(SEL.form2.concessionaryName)).not.toHaveValue('', { timeout: 10_000 });
    await ss('04-form2-antes-continuar');

    await logEmptyFields(page, '#MainContent_ucCarRegistration_ucGeneralInfo', ss);
    await clickContinuar(page, SEL.form2.continuar);

    // ══════════════════════════════════════════════════════════════════════
    // FORMULARIO 3 — Información del Vehículo
    // ══════════════════════════════════════════════════════════════════════

    await ss('05-form3-inicio');

    // REGLA 3: Selects primero
    await setIfBlank(page, page.locator(SEL.form3.color),          TEST_DATA.color,       { isSelect: true });
    await setIfBlank(page, page.locator(SEL.form3.titleType),      TEST_DATA.titleType,   { isSelect: true });
    await setIfBlank(page, page.locator(SEL.form3.vehicleType),    TEST_DATA.vehicleType, { isSelect: true });
    await setIfBlank(page, page.locator(SEL.form3.vehicleUseType), TEST_DATA.vehicleUseType, { isSelect: true });
    await setIfBlank(page, page.locator(SEL.form3.propulsionType), TEST_DATA.propulsionType, { isSelect: true });

    // Inputs de texto — después de todos los selects
    await setIfBlank(page, page.locator(SEL.form3.year),       TEST_DATA.year);
    await setIfBlank(page, page.locator(SEL.form3.make),       TEST_DATA.make);
    await setIfBlank(page, page.locator(SEL.form3.model),      TEST_DATA.model);
    await setIfBlank(page, page.locator(SEL.form3.doors),      TEST_DATA.doors,      { allowZero: false });
    await setIfBlank(page, page.locator(SEL.form3.cylinder),   TEST_DATA.cylinder,   { allowZero: false });
    await setIfBlank(page, page.locator(SEL.form3.horsepower), TEST_DATA.horsepower, { allowZero: false });
    await setIfBlank(page, page.locator(SEL.form3.odometer),   TEST_DATA.odometer,   { allowZero: true  });

    // Fechas — tripleClick + fill para limpiar el valor previo del calendar
    await page.locator(SEL.form3.titleSaleDate).fill(TEST_DATA.titleSaleDate);
    await page.keyboard.press('Tab');

    await page.locator(SEL.form3.validityDate).fill(TEST_DATA.validityDate);
    await page.keyboard.press('Tab');

    await page.locator(SEL.form3.receivedDate).fill(TEST_DATA.receivedDate);
    await page.keyboard.press('Tab');
    await waitForPageIdle(page);

    await page.locator(SEL.form3.eventDate).fill(TEST_DATA.eventDate);
    await page.keyboard.press('Tab');
    await waitForPageIdle(page);

    // Placa, sticker y datos financieros
    await setIfBlank(page, page.locator(SEL.form3.plateNumber), TEST_DATA.plateNumber);
    await setIfBlank(page, page.locator(SEL.form3.sticker),     TEST_DATA.sticker);

    await setIfBlank(page, page.locator(SEL.form3.contractNumber),    TEST_DATA.contractNumber);
    await setIfBlank(page, page.locator(SEL.form3.contributoryPrice), TEST_DATA.contributoryPrice);
    await setIfBlank(page, page.locator(SEL.form3.exciseTaxes),       TEST_DATA.exciseTaxes);

    await ss('06-form3-antes-continuar');

    await logEmptyFields(page, '#MainContent_ucCarRegistration_ucVehicleRegistryInfo', ss);
    await clickContinuar(page, SEL.form3.continuar);

    // ══════════════════════════════════════════════════════════════════════
    // FORMULARIO 4 — Confirmación Digital
    // ══════════════════════════════════════════════════════════════════════

    await ss('07-form4-check1');
    await expect(page.locator(SEL.form4.check1)).toBeVisible({ timeout: 15_000 });
    await page.locator(SEL.form4.check1).check();
    await clickContinuar(page, SEL.form4.continuar);

    await ss('08-form4-check2');
    await expect(page.locator(SEL.form4.check2)).toBeVisible({ timeout: 15_000 });
    await page.locator(SEL.form4.check2).check();
    await clickContinuar(page, SEL.form4.continuar);

    // Continuar final
    await ss('09-form4-before-final-continue');
    await clickContinuar(page, SEL.form4.continuar);

    // ══════════════════════════════════════════════════════════════════════
    // RESULTADO — Número de caso generado
    // ══════════════════════════════════════════════════════════════════════

    await waitForPageIdle(page);
    await ss('10-resultado-final');

    // Verificar que existe un número de caso con formato YYYYMMDD-NNNNN
    const caseNumberEl = page.locator('text=/^\\d{8}-\\d+$/').first();
    await expect(caseNumberEl).toBeVisible({ timeout: 20_000 });
    const caseNumber = await caseNumberEl.textContent();
    console.log(`[RESULT] Caso generado: ${caseNumber}`);

    // Diálogo "¿Imprimir?" — responder No
    const noPrintBtn = page.locator(SEL.result.noPrintBtn);
    const noPrintVisible = await noPrintBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    if (noPrintVisible) {
      await noPrintBtn.click();
      await waitForPageIdle(page);
    }

    await ss('11-fin-flujo');
  });

  // ── ESCENARIO 2 — VIN con formato inválido ─────────────────────────────────

  test('NEG-01 | VIN con formato inválido muestra error de validación', async ({ page }, testInfo) => {
    const ss = makeScreenshot(page, testInfo);

    await loginAutoReg(page);
    await page.goto('/Forms/CarRegistrationBatch.aspx');
    await waitForPageIdle(page);

    // Formulario 1: datos mínimos con VIN en mal formato
    await page.locator(SEL.form1.buyTypeCategory).selectOption(TEST_DATA.buyTypeCategory);
    await waitForPageIdle(page);

    await page.locator(SEL.form1.salePrice).fill(TEST_DATA.salePrice);
    await page.locator(SEL.form1.licenseNumber).fill(TEST_DATA.licenseNumber);

    // VIN con formato inválido (demasiado corto / caracteres inválidos)
    await page.locator(SEL.form1.vinInput).fill(TEST_DATA.vinInvalidFormat);
    await ss('neg01-vin-invalido-llenado');

    // Intentar continuar para disparar la validación
    await page.locator(SEL.form1.continuar).click();
    await waitForPageIdle(page);
    await ss('neg01-vin-invalido-after-submit');

    // ASSERT: el span de validación del VIN debe estar visible con mensaje de error
    const vinValidator = page.locator(SEL.form1.vinValidator);
    await expect(vinValidator).toBeVisible({ timeout: 10_000 });

    const errorText = await vinValidator.textContent();
    expect(errorText?.trim().length, 'El span de validación de VIN debe tener texto de error').toBeGreaterThan(0);
    console.log(`[VIN-INVALID] Mensaje de validación: "${errorText?.trim()}"`);
  });

  // ── ESCENARIO 3 — VIN ya registrado en el sistema ─────────────────────────

  test('NEG-02 | VIN ya existente en el sistema muestra mensaje de error', async ({ page }, testInfo) => {
    const ss = makeScreenshot(page, testInfo);

    // Precondición: TEST_DATA.vinAlreadyExists debe ser un VIN ya registrado en preprod
    if (TEST_DATA.vinAlreadyExists === 'TODO_VIN_EXISTENTE') {
      test.skip(true, 'TODO: Configurar TEST_DATA.vinAlreadyExists con un VIN ya registrado en preprod');
    }

    await loginAutoReg(page);
    await page.goto('/Forms/CarRegistrationBatch.aspx');
    await waitForPageIdle(page);

    // Formulario 1: datos con VIN ya registrado
    await page.locator(SEL.form1.buyTypeCategory).selectOption(TEST_DATA.buyTypeCategory);
    await waitForPageIdle(page);

    await page.locator(SEL.form1.salePrice).fill(TEST_DATA.salePrice);
    await page.locator(SEL.form1.licenseNumber).fill(TEST_DATA.licenseNumber);
    await page.locator(SEL.form1.vinInput).fill(TEST_DATA.vinAlreadyExists);
    await ss('neg02-vin-existente-llenado');

    // Intentar continuar
    await page.locator(SEL.form1.continuar).click();
    await waitForPageIdle(page);
    await ss('neg02-vin-existente-after-submit');

    // ASSERT: El sistema muestra un mensaje de error (alert modal o span de validación)
    // El sitio puede responder en el span del VIN O en el alert modal
    const vinValidatorVisible  = await page.locator(SEL.form1.vinValidator).isVisible().catch(() => false);
    const alertMessageVisible  = await page.locator(SEL.form1.alertMessage).isVisible().catch(() => false);

    expect(
      vinValidatorVisible || alertMessageVisible,
      'Se esperaba un mensaje de error al usar un VIN ya registrado (span de validación o alert modal)',
    ).toBe(true);

    if (alertMessageVisible) {
      const alertText = await page.locator(SEL.form1.alertMessage).textContent();
      console.log(`[VIN-EXISTS] Alert del sistema: "${alertText?.trim()}"`);

      // Cerrar el alert si tiene botón OK
      const okBtn = page.locator(SEL.form1.alertOkBtn);
      const okBtnVisible = await okBtn.isVisible().catch(() => false);
      if (okBtnVisible) {
        await okBtn.click();
        await waitForPageIdle(page);
      }
    }

    if (vinValidatorVisible) {
      const errorText = await page.locator(SEL.form1.vinValidator).textContent();
      console.log(`[VIN-EXISTS] Validator: "${errorText?.trim()}"`);
    }

    await ss('neg02-vin-existente-fin');
  });

});
