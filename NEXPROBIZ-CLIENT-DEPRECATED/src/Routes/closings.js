import { ClosingViews } from "../Views"


const closing_routes = [
  {
    path: '/closings',
    view: ClosingViews,
    title: "Financial Year Closings",
    layout: 'app',
    sub_layout: 'closings_layout'
  }
]

export default closing_routes