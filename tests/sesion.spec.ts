import { test, expect } from '../fixtures/saucedemo.fixture';

/**
 * Suite 5 — Sesión (9418)
 * Test Cases de logout y persistencia de sesión
 */

test.describe('Suite 5 — Sesión', () => {
  
  /**
   * TC-015 (ID: 9433) — Logout desde el menú
   * Prioridad: 1
   * 
   * Pasos:
   * 1. Iniciar sesión con usuario: standard_user y contraseña: secret_sauce
   * 2. Hacer clic en el ícono de menú (hamburger) en la esquina superior izquierda
   * 3. Hacer clic en "Logout"
   * 
   * Resultado esperado: El sistema redirige a la página de login y la sesión queda cerrada
   */
  test('TC-015 — Logout desde el menú @tc9433', async ({ sauceDemoPage, page }) => {
    // STEP 1: Iniciar sesión con usuario: standard_user y contraseña: secret_sauce
    await sauceDemoPage.login('standard_user', 'secret_sauce');
    
    // Verificar: El login es exitoso y se muestra el catálogo
    expect(await sauceDemoPage.isInventoryVisible()).toBeTruthy();
    
    // STEP 2: Hacer clic en el ícono de menú (hamburger)
    await sauceDemoPage.openMenu();
    
    // Verificar: El menú lateral se despliega mostrando las opciones disponibles
    expect(await sauceDemoPage.isMenuOpen()).toBeTruthy();
    
    // STEP 3: Hacer clic en "Logout"
    await sauceDemoPage.logout();
    
    // Verificar: El sistema redirige a la página de login y la sesión queda cerrada
    expect(await sauceDemoPage.isOnLoginPage()).toBeTruthy();
    expect(page.url()).toContain('saucedemo.com');
    expect(page.url()).not.toContain('inventory');
  });

  /**
   * TC-016 (ID: 9434) — Sesión no persiste después del logout
   * Prioridad: 2
   * 
   * Pasos:
   * 1. Iniciar sesión con usuario: standard_user y contraseña: secret_sauce
   * 2. Hacer logout desde el menú lateral
   * 3. Intentar navegar directamente a https://www.saucedemo.com/inventory.html
   * 
   * Resultado esperado: El sistema redirige al login en lugar de mostrar el inventario
   */
  test('TC-016 — Sesión no persiste después del logout @tc9434', async ({ sauceDemoPage, page }) => {
    // STEP 1: Iniciar sesión con usuario: standard_user y contraseña: secret_sauce
    await sauceDemoPage.login('standard_user', 'secret_sauce');
    
    // Verificar: El login es exitoso y se muestra el catálogo
    expect(await sauceDemoPage.isInventoryVisible()).toBeTruthy();
    
    // STEP 2: Hacer logout desde el menú lateral
    await sauceDemoPage.openMenu();
    await sauceDemoPage.logout();
    
    // Verificar: El sistema redirige a la página de login
    expect(await sauceDemoPage.isOnLoginPage()).toBeTruthy();
    
    // STEP 3: Intentar navegar directamente a inventory.html
    await page.goto('https://www.saucedemo.com/inventory.html');
    
    // Verificar: El sistema redirige al login en lugar de mostrar el inventario
    // Esperar un momento para la redirección
    await page.waitForTimeout(1000);
    
    // Confirmar que la sesión no persiste - el usuario debe estar en login o ver error
    const isOnLogin = await sauceDemoPage.isOnLoginPage();
    const inventoryNotVisible = !(await sauceDemoPage.isInventoryVisible());
    
    // Al menos una de estas debe ser verdadera
    expect(isOnLogin || inventoryNotVisible).toBeTruthy();
  });

});
