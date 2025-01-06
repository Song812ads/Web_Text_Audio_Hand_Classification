import React from 'react'
import "../component/default_tool/style.css"

const DefaultPage = ({type}) => {

switch (type){
    case 'home':
        return (
                <div  className='h-text text-light'>
                    <h1>Hello everyone</h1>
                    <h1>Welcome to my Presentation</h1>
                </div>

          )
    case 'present':
        return(
        <div  className='h-text text-light'>
            <h1>Presentation</h1>
        </div>
        )
}

}

export default DefaultPage