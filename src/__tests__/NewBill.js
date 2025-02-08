/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import {localStorageMock} from "../__mocks__/localStorage.js"
import router from "../app/Router.js"
import {ROUTES, ROUTES_PATH} from "../constants/routes.js"
import mockStore from "../__mocks__/store";
import { bills } from "../fixtures/bills.js"


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then send bill icon in vertical layout should be highlighted", async () => {
          Object.defineProperty(window, 'localStorage', { value: localStorageMock })
          
          window.localStorage.setItem(
            'user', 
            JSON.stringify({
              type: 'Employee'
            })
          )

          const root = document.createElement("div")

          root.setAttribute("id", "root")
          document.body.append(root)
          router()
          window.onNavigate(ROUTES_PATH.NewBill)

          await waitFor(() => screen.getByTestId('icon-mail'))
          const mailIcon = screen.getByTestId('icon-mail')
    
          //on vérifie que l'icone a la classe "active-icon"
          expect(mailIcon.classList.contains('active-icon')).toBe(true)          
    })

    describe("When I upload a file", () => {
      let newBill

      beforeEach(() => {
        Object.defineProperty(window, "localStorage", { value: localStorageMock })
        window.localStorage.setItem(
          "user", 
          JSON.stringify({ 
            type: "Employee" 
          })
        )

        newBill = new NewBill({
          document,
          onNavigate: () => {},
          store: mockStore, // Mock du store
          localStorage: window.localStorage
        })
      })

      test("Then the file is accepted if the file format is valid (jpeg/png)", () => {   
        const fileInput = screen.getByTestId("file")
        const file = new File(["image"], "test.jpg", { type: "image/jpeg" })

        const handleChangeFile = jest.fn(newBill.handleChangeFile)
        fileInput.addEventListener("change", handleChangeFile)

        userEvent.upload(fileInput, file)

        expect(handleChangeFile).toHaveBeenCalled()
        expect(fileInput.files[0].name).toBe("test.jpg")
      })

      test("Then an error message appears and the input is cleared if the file format is invalid", () => {
                
        const fileInput = screen.getByTestId("file")
        const errorMessage = document.querySelector("#file-error-message")
        const file = new File(["document"], "test.pdf", { type: "application/pdf" })

        userEvent.upload(fileInput, file)

        expect(errorMessage.style.display).toBe("block")
        expect(fileInput.value).toBe("")
      })
    })

    describe("When I submit the form", () => {
      test("Then the form is not submitted if required fields are empty", () => {
        Object.defineProperty(window, "localStorage", { value: localStorageMock })
        window.localStorage.setItem(
          "user", 
          JSON.stringify({ 
            type: "Employee" 
          })
        )

        document.body.innerHTML = NewBillUI()

        const newBill = new NewBill({
          document,
          onNavigate: () => {},
          store: mockStore, // Mock du store
          localStorage: window.localStorage
        })

        const handleSubmit = jest.fn(newBill.handleSubmit)
        const updateBill = jest.fn(newBill.updateBill)
        
        const form = screen.getByTestId("form-new-bill")
        form.addEventListener("submit", handleSubmit)

        const submitButton = screen.getByTestId("form-new-bill").querySelector("button[type='submit']")
        userEvent.click(submitButton)        
        
        //on vérifie qu'on a bien appelé la méthode submit, 
        // que le champs sont vide 
        // et qu'on appele pas la méthode d'envoi des données
        expect(handleSubmit).toHaveBeenCalled()
        expect(screen.getByTestId("expense-name").value).toBe("")
        expect(screen.getByTestId("amount").value).toBe("")
        expect(screen.getByTestId("datepicker").value).toBe("")
        expect(screen.getByTestId("pct").value).toBe("")
        expect(screen.getByTestId("file").value).toBe("")
        
        expect(updateBill).not.toHaveBeenCalled()
      })

      test("Then it should submit successfully if all fields are filled", () => {
        Object.defineProperty(window, "localStorage", { value: localStorageMock })
        window.localStorage.setItem(
          "user", 
          JSON.stringify({ 
            type: "Employee" 
          })
        )

        document.body.innerHTML = NewBillUI()
        
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }

        const newBill = new NewBill({
          document,
          onNavigate: onNavigate,
          store: mockStore, 
          localStorage: window.localStorage
        })

        const handleSubmit = jest.spyOn(newBill, "handleSubmit")

        const mockBill = bills[0];

        userEvent.type(screen.getByTestId("expense-type"), mockBill.type)
        userEvent.type(screen.getByTestId("expense-name"), mockBill.name)
        userEvent.type(screen.getByTestId("amount"), mockBill.amount.toString())
        userEvent.type(screen.getByTestId("datepicker"), mockBill.date)
        userEvent.type(screen.getByTestId("vat"), mockBill.vat)
        userEvent.type(screen.getByTestId("pct"), mockBill.pct.toString())
        userEvent.type(screen.getByTestId("commentary"), mockBill.commentary)
        
        const fileInput = screen.getByTestId("file")
        const file = new File(["image"], mockBill.fileUrl, { type: "image/jpeg" })
        userEvent.upload(fileInput, file)
        expect(fileInput.files[0].name).toBe(mockBill.fileUrl)
        
        const form = screen.getByTestId("form-new-bill")
        form.addEventListener("submit", handleSubmit)
        
        const submitButton = document.getElementById("btn-send-bill")        
        userEvent.click(submitButton)
        
        expect(handleSubmit).toHaveBeenCalled()
        expect(screen.getByText("Mes notes de frais")).toBeTruthy() //On vérifie la redirection après acceptation du formulaire
      })

    })

  })
})
