/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockedBills from "../__mocks__/store.js"

import router from "../app/Router.js";

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
      //to-do write expect expression

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
