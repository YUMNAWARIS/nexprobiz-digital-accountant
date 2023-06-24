import "./App.css";
import { Route, Routes } from "react-router-dom";
import { View } from "./components/App/view";
import { Home } from "./components/App/home";
import account_book_routes from './Routes/accountBooks'
import owner_routes from './Routes/owners'
import transactions_routes from "./Routes/transactions";
import statement_routes from "./Routes/statements";
import closing_routes from "./Routes/closings";
function App() {
  const routes = [
    {
      path: '/',
      view: Home,
      title: "Home",
      layout: 'app',
      sub_layout: 'home_layout'
    },
    ...account_book_routes,
    ...owner_routes,
    ...transactions_routes,
    ...statement_routes,
    ...closing_routes
  ];
  console.log("object");
  return (
    <>
      <Routes>
        {routes.map((route) => {
          return (
            <Route
              key={route.path}
              exact
              path={route.path}
              element={
                <View
                  display={route.view}
                  layout={route.layout}
                  sub_layout={route.sub_layout}
                  title={route.title}
                />
              }
            ></Route>
          );
        })}
      </Routes>
    </>
  );
}

export default App;
