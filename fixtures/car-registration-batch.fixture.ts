import { Page, Locator, expect } from '@playwright/test';

// ─── TEST DATA ──────────────────────────────────────────────────────────────

export const TEST_DATA = {
  // Credenciales
  username:  'jovidio',
  password:  '123456',

  // Formulario 1 — Datos Generales
  buyTypeCategory: '7',          // Compra de Concesionario
  salePrice:       '50000',
  licenseNumber:   '4879680',    // yaml: licence
  vin:             'JTDBU4EE1A9076547', // TODO: reemplazar con VIN válido en preprod

  // Formulario 2 — Información del Concesionario
  dealerLicense:   '4879680',    // yaml: licence

  // Formulario 3 — Información del Vehículo
  year:            '2025',
  make:            'TOYOTA',
  model:           'COROLLA',
  color:           'BLA',          // select value = "BLA" (Blanco)
  doors:           '4',
  cylinder:        '4',
  horsepower:      '159',
  odometer:        '10',
  titleType:       '2',            // select value
  titleSaleDate:   '03/28/2026',
  vehicleType:     '5',
  vehicleUseType:  '1',
  propulsionType:  '1',
  plateNumber:     'AFV542',
  sticker:         '12054856544',
  validityDate:    '03/28/2026',
  receivedDate:    '03/28/2026',
  eventDate:       '03/28/2026',
  contractNumber:  '100000000000',
  contributoryPrice: '35000',
  exciseTaxes:       '27000',

  // Escenarios negativos de VIN
  vinInvalidFormat:  'ABC123',             // formato corto/inválido
  vinAlreadyExists:  'TODO_VIN_EXISTENTE', // TODO: VIN ya registrado en preprod
};

// ─── SELECTORES (PRIORITY 1 — id) ──────────────────────────────────────────

export const SEL = {

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  login: {
    username: '#LoginUser_UserName',  // id="LoginUser_UserName"
    password: '#LoginUser_Password',  // id="LoginUser_Password"
    submit:   '#btnTriggerLogin',     // id="btnTriggerLogin" (div clickable — PRIORITY 1)
  },

  // ── TERMS & CONDITIONS (aparece solo en primer login de la sesión) ─────────
  terms: {
    check1:   '#ucTermsConditions_gvTermConditionsBullets_chkChecked_0',
    check2:   '#ucTermsConditions_gvTermConditionsBullets_chkChecked_1',
    check3:   '#ucTermsConditions_gvTermConditionsBullets_chkChecked_2',
    check4:   '#ucTermsConditions_gvTermConditionsBullets_chkChecked_3',
    confirm:  '#ucTermsConditions_btnSubmit',
  },

  // ── HOME ───────────────────────────────────────────────────────────────────
  home: {
    registerBtn: '#MainContent_navMenu_ibtndivRegistrosBatch', // yaml: registerButton
  },

  // ── FORM 1 — Datos Generales ───────────────────────────────────────────────
  form1: {
    buyTypeCategory: '#MainContent_ucCarRegistration_ddlCategory',
    salePrice:       '#ctl00_MainContent_ucCarRegistration_txtSalePrice',
    licenseNumber:   '#MainContent_ucCarRegistration_txtLicenseNumber',
    vinInput:        '#MainContent_ucCarRegistration_txtVIN',
    vinValidator:    '#MainContent_ucCarRegistration_cvalVIN',      // span de error de VIN
    alertMessage:    '#MainContent_ucCarRegistration_mbMessage_lblMessage', // texto del alert
    alertOkBtn:      '#MainContent_ucCarRegistration_mbMessage_btnOK',     // yaml: registrationAlert
    confirmOwner:    '#MainContent_ucCarRegistration_btnConfirmationOwner', // yaml: registrationDataUserConfirmButton
    continuar:       '#PageFunctionsContent_ucRightFunctionBox_lvwFunctions_imbFunction_0',
  },

  // ── FORM 2 — Concesionario ─────────────────────────────────────────────────
  form2: {
    dealerLicense:     '#MainContent_ucCarRegistration_ucGeneralInfo_txtLicense',          // yaml: registrationDealerLicenceInput
    searchLicenseBtn:  '#MainContent_ucCarRegistration_ucGeneralInfo_BtnSearchLicense',    // yaml: registrationSearchLicenceButton
    concessionaryName: '#MainContent_ucCarRegistration_ucGeneralInfo_txtConcepcionarioName', // yaml: registrationConcessionaryName
    licenseDate:       '#MainContent_ucCarRegistration_ucGeneralInfo_txtLicenseDate',        // yaml: registrationLicenceDateInput
    continuar:         '#PageFunctionsContent_ucRightFunctionBox_lvwFunctions_imbFunction_0',
  },

  // ── FORM 3 — Información del Vehículo ─────────────────────────────────────
  form3: {
    year:             '#ctl00_MainContent_ucCarRegistration_ucVehicleRegistryInfo_txtYear',
    make:             '#MainContent_ucCarRegistration_ucVehicleRegistryInfo_txtMake',
    model:            '#MainContent_ucCarRegistration_ucVehicleRegistryInfo_txtModel',
    color:            '#MainContent_ucCarRegistration_ucVehicleRegistryInfo_ddlColor1',
    doors:            '#ctl00_MainContent_ucCarRegistration_ucVehicleRegistryInfo_txtDoors',
    cylinder:         '#ctl00_MainContent_ucCarRegistration_ucVehicleRegistryInfo_txtCylinder',
    horsepower:       '#ctl00_MainContent_ucCarRegistration_ucVehicleRegistryInfo_txtAutoHorseForce',
    odometer:         '#ctl00_MainContent_ucCarRegistration_ucVehicleRegistryInfo_txtOdometer',
    titleType:        '#MainContent_ucCarRegistration_ucVehicleRegistryInfo_ddlTitle',
    titleSaleDate:    '#MainContent_ucCarRegistration_ucVehicleRegistryInfo_txtTitleSaleDate',
    vehicleType:      '#MainContent_ucCarRegistration_ucVehicleRegistryInfo_ddlVehicleType',
    vehicleUseType:   '#MainContent_ucCarRegistration_ucVehicleRegistryInfo_ddlVehicleUseType',
    propulsionType:   '#MainContent_ucCarRegistration_ucVehicleRegistryInfo_ddlVehiclePropulsionType',
    plateNumber:      '#MainContent_ucCarRegistration_ucVehicleRegistryInfo_txtPlateNumber',
    sticker:          '#MainContent_ucCarRegistration_ucVehicleRegistryInfo_txtRegistrationSticker',
    validityDate:     '#MainContent_ucCarRegistration_ucVehicleRegistryInfo_txtValidityDateFrom',
    receivedDate:     '#MainContent_ucCarRegistration_ucVehicleRegistryInfo_txtRecievedDate',
    eventDate:        '#MainContent_ucCarRegistration_ucVehicleRegistryInfo_txtEventDate',
    contractNumber:   '#MainContent_ucCarRegistration_ucVehicleRegistryInfo_txtContractNumber',
    contributoryPrice:'#ctl00_MainContent_ucCarRegistration_ucVehicleRegistryInfo_txtContributoryPrice',
    exciseTaxes:      '#ctl00_MainContent_ucCarRegistration_ucVehicleRegistryInfo_txtExciseTaxesPaid',
    continuar:        '#PageFunctionsContent_ucRightFunctionBox_lvwFunctions_imbFunction_0',
  },

  // ── FORM 4 — Confirmación Digital ─────────────────────────────────────────
  form4: {
    check1:    '#MainContent_ucCarRegistration_chkConfirmation', // yaml: registrationDigitalCheckButton1
    check2:    '#MainContent_ucCarRegistration_CheckBox1',       // yaml: registrationDigitalCheckButton2
    continuar: '#PageFunctionsContent_ucRightFunctionBox_lvwFunctions_imbFunction_0',
  },

  // ── RESULT ─────────────────────────────────────────────────────────────────
  result: {
    // El número de caso es dinámico; se valida con regex: /^\d{8}-\d+$/
    noPrintBtn: 'button:has-text("No")',  // diálogo de impresión al final
  },
};

// ─── HELPERS ────────────────────────────────────────────────────────────────

/**
 * Espera que la página esté completamente idle incluyendo UpdatePanel de ASP.NET.
 */
export async function waitForPageIdle(page: Page, timeout = 20_000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
  await page.waitForFunction(() => {
    const prm = (window as any).Sys?.WebForms?.PageRequestManager?.getInstance?.();
    return !prm || !prm.get_isInAsyncPostBack();
  }, { timeout });
}

/**
 * Llena un input solo si está vacío o en '0'. No sobreescribe datos pre-llenados.
 */
export async function setIfBlank(
  page: Page,
  locator: Locator,
  value: string,
  opts: { isSelect?: boolean; allowZero?: boolean } = {},
): Promise<void> {
  const current = await locator.inputValue().catch(() => '');
  const isBlank = !current || current === '' || current === 'Seleccionar';
  const isZero  = !opts.allowZero && ['0', '$0', '0.00', '$0.00'].includes(current);

  if (!isBlank && !isZero) return;

  if (opts.isSelect) {
    await locator.selectOption(value);
    await waitForPageIdle(page);
  } else {
    await safeSetValue(page, await locator.getAttribute('id').then(id => id ? `#${id}` : ''), value);
  }
}

/**
 * REGLA 11 — Llena un campo con verificación de éxito.
 * Si fill() deja el campo vacío (campo JS-RESTRICTED con oninput/onkeypress),
 * usa page.evaluate como fallback automático.
 */
export async function safeSetValue(page: Page, selector: string, value: string): Promise<void> {
  if (!selector) return;
  const loc = page.locator(selector);
  await loc.click();
  await loc.fill(value);
  const current = await loc.inputValue().catch(() => '');
  if (!current || current.replace(/[^a-zA-Z0-9.,$ ]/g, '') === '') {
    // Fallback para campos con oninput/onkeypress restrictivo
    const rawId = selector.startsWith('#') ? selector.slice(1) : selector;
    await page.evaluate((args: { id: string; val: string }) => {
      const el = document.getElementById(args.id) as HTMLInputElement;
      if (!el) return;
      el.value = args.val;
      el.dispatchEvent(new Event('input',  { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, { id: rawId, val: value });
  }
}

/**
 * Verifica que el localizador sea visible y esté habilitado antes de hacer click.
 */
export async function waitForClickable(locator: Locator, timeout = 10_000): Promise<void> {
  await expect(locator).toBeVisible({ timeout });
  await expect(locator).toBeEnabled({ timeout });
}

/**
 * Hace click en Continuar con espera de idle antes y después.
 */
export async function clickContinuar(page: Page, selector: string): Promise<void> {
  await waitForPageIdle(page);
  const btn = page.locator(selector);
  await waitForClickable(btn);
  await btn.click();
  await waitForPageIdle(page);
}

/**
 * REGLA 6 — Diagnóstico de campos vacíos antes de submit.
 * NO es un assert duro — registra warnings y screenshot para corrección.
 */
export async function logEmptyFields(
  page: Page,
  formSelector: string,
  ss: (name: string) => Promise<void>,
): Promise<void> {
  const ALLOWED_ZERO = ['txtOdometer'];

  const empties = await page.evaluate((args: { formSel: string; allowedZero: string[] }) => {
    const container = document.querySelector(args.formSel) ?? document;
    const elements  = container.querySelectorAll(
      'input[type="text"]:not([disabled]):not([readonly]), select:not([disabled])',
    );
    type Result = { id: string; value: string };
    const results: Result[] = [];

    for (const el of Array.from(elements)) {
      const input = el as HTMLInputElement | HTMLSelectElement;
      const v     = input.value ?? '';
      const id    = input.id ?? '';

      if ((el as HTMLElement).offsetParent === null) continue;
      if (args.allowedZero.some((k: string) => id.includes(k))) continue;

      const isEmpty = !v || v === '' || v === 'Seleccionar';
      const isZero  = ['0', '$0', '0.00', '$0.00'].includes(v);

      if (isEmpty || isZero) results.push({ id, value: v });
    }
    return results;
  }, { formSel: formSelector, allowedZero: ALLOWED_ZERO });

  if (empties.length > 0) {
    console.warn(`[EMPTY-FIELDS] ${empties.length} campo(s) vacíos antes de Continuar:`, JSON.stringify(empties));
    await ss('warn-campos-vacios');
  }
}

/**
 * Toma screenshot y lo adjunta al reporte.
 */
export function makeScreenshot(page: Page, testInfo: import('@playwright/test').TestInfo) {
  return async (name: string): Promise<void> => {
    const buf = await page.screenshot({ fullPage: true });
    await testInfo.attach(name, { body: buf, contentType: 'image/png' });
  };
}

/**
 * Realiza el login en AutoReg.
 * Maneja T&C condicionales (solo aparecen en el primer login de la sesión).
 */
export async function loginAutoReg(page: Page): Promise<void> {
  await page.goto('/Forms/Account/LoginNew.aspx');
  await waitForPageIdle(page);

  await page.locator(SEL.login.username).fill(TEST_DATA.username);
  await page.locator(SEL.login.password).fill(TEST_DATA.password);

  await waitForClickable(page.locator(SEL.login.submit));
  await page.locator(SEL.login.submit).click();
  await waitForPageIdle(page);

  // T&C — solo si aparece (primer login de la sesión)
  const termsVisible = await page.locator(SEL.terms.check1).isVisible().catch(() => false);
  if (termsVisible) {
    await page.locator(SEL.terms.check1).check();
    await page.locator(SEL.terms.check2).check();
    await page.locator(SEL.terms.check3).check();
    await page.locator(SEL.terms.check4).check();
    await waitForClickable(page.locator(SEL.terms.confirm));
    await page.locator(SEL.terms.confirm).click();
    await waitForPageIdle(page);
  }

  // Confirmar que llegamos al home
  await expect(page.locator(SEL.home.registerBtn)).toBeVisible({ timeout: 15_000 });
}
