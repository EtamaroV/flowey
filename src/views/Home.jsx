import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/authContext';

function Home() {
  const { plants, user } = useAuth();

  let navigate = useNavigate();

  return (
    <>
      <div className="w-full p-4">
        <div className="text-3xl font-bold pt-4">
          Your Flowy
        </div>
        <div className="grid grid-cols-4 gap-x-4 gap-y-2 mt-4">
          {plants.map(plant => (

            <div className="justify-center" key={plant.uuid}>
              <div onClick={() => navigate(`/plant/${plant.uuid}`, { replace: true })} className="plants-list-shadow flex justify-center aspect-square rounded-xl bg-[#FEFEFE] border-2 border-[#F3F3F3]">
                <div className="text-center self-center">
                  <img src='https://i.postimg.cc/rmsrsfcc/Thai-Basil.png' className='p-[15%]'></img>
                </div>
              </div>
              <div className="text-center text-sm">
                {plant.nickname}
              </div>
            </div>

          ))}


          <div className="justify-center">
            <div onClick={() => navigate('/add', { replace: true })} className="plants-list-shadow aspect-square rounded-xl bg-[#FEFEFE] border-2 border-[#F3F3F3] p-[25%]">
              <svg className="fill-[#b5b5b5]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z" /></svg>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Home