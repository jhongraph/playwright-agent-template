import { test as base, expect, Page } from '@playwright/test';

/**
 * Fixture para Saucedemo - Suite 5 Sesión
 * TC-015: Logout desde el menú
 * TC-016: Sesión no persiste después del logout
 */

// Page Object para Saucedemo
export class SauceDemoPage {
  constructor(private page: Page) {}

  // Selectores
  readonly usernameInput = '#user-name';
  readonly passwordInput = '#password';
  readonly loginButton = '#login-button';
  readonly menuButton = '#react-burger-menu-btn';
  readonly logoutLink = '#logout_sidebar_link';
  readonly inventoryContainer = '.inventory_container';
  readonly errorMessage = '[data-test="error"]';

  async login(username: string, password: string) {
    await this.page.goto('/');
    await this.page.fill(this.usernameInput, username);
    await this.page.fill(this.passwordInput, password);
    await this.page.click(this.loginButton);
    // Esperar a que cargue el inventario
    await this.page.waitForSelector(this.inventoryContainer, { timeout: 10000 });
  }

  async openMenu() {
    await this.page.click(this.menuButton);
    // Esperar a que el menú se abra
    await this.page.waitForSelector(this.logoutLink, { state: 'visible', timeout: 5000 });
  }

  async logout() {
    await this.page.click(this.logoutLink);
    // Esperar redirección al login
    await this.page.waitForSelector(this.loginButton, { timeout: 5000 });
  }

  async isOnLoginPage(): Promise<boolean> {
    return await this.page.isVisible(this.loginButton);
  }

  async isInventoryVisible(): Promise<boolean> {
    return await this.page.isVisible(this.inventoryContainer);
  }

  async isMenuOpen(): Promise<boolean> {
    return await this.page.isVisible(this.logoutLink);
  }
}

// Extender el test base con el fixture
export const test = base.extend<{ sauceDemoPage: SauceDemoPage }>({
  sauceDemoPage: async ({ page }, use) => {
    const sauceDemoPage = new SauceDemoPage(page);
    await use(sauceDemoPage);
  },
});

export { expect };
