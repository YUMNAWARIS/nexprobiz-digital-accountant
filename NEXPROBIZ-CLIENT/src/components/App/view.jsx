import  {AppLayout}  from "../../Layout/appLayout"

export function View(props) {
    const layouts = {
        app: AppLayout,
    }
    
    document.title = props.title
    let Layout = props.layout ? layouts[props.layout] : AppLayout

    if(!props.display){
        return false;
    }
    return (
        <Layout title={props.title} sub_layout={props.sub_layout}>
            {props.display}
        </Layout>
    )
}
