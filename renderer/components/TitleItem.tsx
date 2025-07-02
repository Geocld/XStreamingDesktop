import { Card, CardBody, CardFooter, Image } from "@nextui-org/react";

function TitleItem(props) {
  const titleItem = props.title || { name: "" };

  const handleClick = () => {
    props.onClick && props.onClick(titleItem);
  };

  let isSupportMKB = false;

  if (titleItem.details && titleItem.details.supportedInputTypes) {
    if (titleItem.details.supportedInputTypes.indexOf('MKB') > -1) {
      isSupportMKB = true;
    }
  }

  return (
    <>
      {titleItem ? (
        <Card className="mb-5" shadow="sm" isPressable onClick={handleClick}>
          <CardBody className="overflow-visible py-2">
            <div className="relative">
              <Image
                alt="Card background"
                className="object-cover rounded-xl"
                src={"https:" + titleItem.Image_Tile.URL}
                width={270}
              />

              <div className="absolute bottom-0 right-0 flex flex-row justify-end z-40 space-x-2 px-2" style={{background: 'rgba(0, 0, 0, .7)'}}>
                <Image
                  src={'/images/icons/gamepad.svg'}
                  alt="gamepad"
                  width={20}
                  height={20}
                />

                {
                  isSupportMKB && (
                    <Image
                      src={'/images/icons/keyboard-mouse.svg'}
                      alt="gamepad"
                      width={20}
                      height={20}
                    />
                  )
                }
              </div>
            </div>
          </CardBody>
          <CardFooter className="pt-0 px-4 flex-col items-start">
            <h4 className="font-bold">{titleItem.ProductTitle}</h4>
          </CardFooter>
        </Card>
      ) : null}
    </>
  );
}

export default TitleItem;
