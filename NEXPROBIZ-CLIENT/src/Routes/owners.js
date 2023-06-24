import { Owners } from "../Views/owners/owner";

const owner_routes = [

  {
    path: '/owners',
    view: Owners,
    title: "Owner's Information",
    layout: 'app',
    sub_layout: 'owner_layout'
  },

]

export default owner_routes