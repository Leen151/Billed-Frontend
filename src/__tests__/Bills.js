/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";

import mockStore from "../__mocks__/store";
import router from "../app/Router.js";
jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')

      //on vérifie que l'icone a la classe "active-icon"
      expect(windowIcon.classList.contains('active-icon')).toBe(true)
    })
    test("Then bills should be ordered from earliest to latest", async () => {
      // Créer une instance de Bills
      const billsInstance = new Bills({
        document,
        onNavigate: () => {},
        store: { 
          bills: () => ({ 
            list: () => Promise.resolve(bills)  // on utilise nos données de tests
          })
        },
        localStorage: window.localStorage
      });
      //on appele la methode getBills pour formatter les données comme dans l'application
      const billsObject = await billsInstance.getBills();
      
      document.body.innerHTML = BillsUI({ data: billsObject })
      const dates = screen.getAllByText(/^(0[1-9]|[12][0-9]|3[01])\s([A-Za-z]{3})\.\s(19|20)\d\d$/i).map(a => a.innerHTML)

      //on ne peut pas comparer des dates sous forme de chaine de caractère
      //il faut les transformer en objet Date
      //et les dates sont affichés sous forme "29 Nov. 2024", il faut enlever le "." pour les transformer en date
      const datesSorted = [...dates].sort((a, b) => new Date(b.replace('.', '')) - new Date(a.replace('.', '')));

      expect(dates).toEqual(datesSorted)
    })
  })
})
// test d'intégration Get
describe("Given I am connected as an employee", () => {
  describe("When I navigate to the Bills page", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => screen.getByText("Mes notes de frais"));

      //Vérifie la présence du bouton "Nouvelle note de frais"
      const newBillButton = screen.getByTestId("btn-new-bill");
      expect(newBillButton).toBeTruthy();

      //Vérifie que le tableau est rempli
      //(dans les données mockées, on a 4 "bills")
      const billsTable = screen.getByTestId("tbody");
      const billRows = billsTable.querySelectorAll("tr");
      expect(billRows.length).toBe(4);

      //Vérifie la présence des icones "oeil"
      const eyeIcons = screen.getAllByTestId("icon-eye");
      expect(eyeIcons.length).toBe(4);
    });

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(
          window, 
          'localStorage', 
          { value: localStorageMock }
        );
        window.localStorage.setItem('user', JSON.stringify({ type: "Employee", email: "a@a" }));
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });

      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => Promise.reject(new Error("Erreur 404"))
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches bills from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => Promise.reject(new Error("Erreur 500"))
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
