
export function OwnerLayout(props){
  return <>
    <h2 style={{margin: '20px'}}>{props.title}</h2>
    {<props.children/>}
  </>
}