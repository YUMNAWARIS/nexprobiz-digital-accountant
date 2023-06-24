import { Typography } from "@material-ui/core";

export function StatementHeader (props){
  return (
    <div>
      <Typography variant="h3" style={{textAlign: 'center', borderBottom: '1px dashed grey'}}>{props.title}</Typography>
      <div>
 
      </div>
    </div>
  )
}