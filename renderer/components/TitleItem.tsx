import React from "react";
import { Card, Image } from "@heroui/react";

function TitleItem(props) {
  const titleItem = props.title || { name: "" };

  const handleClick = () => {
    props.onClick && props.onClick(titleItem);
  };

  let isSupportMKB = false;

  if (titleItem.details && titleItem.details.supportedInputTypes) {
    if (titleItem.details.supportedInputTypes.indexOf("MKB") > -1) {
      isSupportMKB = true;
    }
  }

  if (!titleItem.ProductTitle) return null;

  return (
    <Card
      isPressable
      className="group relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-content1 transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_0_30px_rgba(26,201,84,0.3)] hover:ring-2 hover:ring-primary shadow-lg border border-divider"
      onClick={handleClick}
    >
      {titleItem.Image_Poster && (
        <Image
          removeWrapper
          alt={titleItem.ProductTitle}
          className="z-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          src={"https:" + titleItem.Image_Poster.URL}
        />
      )}

      <div className="absolute top-2 right-2 z-20 flex flex-col gap-2 opacity-80 transition-opacity duration-300 group-hover:opacity-100">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#107C10]/70 backdrop-blur-md shadow-sm">
          <Image src={"/images/icons/gamepad.svg"} alt="gamepad" width={16} height={16} />
        </div>
        {isSupportMKB && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#107C10]/70 backdrop-blur-md shadow-sm">
            <Image src={"/images/icons/keyboard-mouse.svg"} alt="mkb" width={16} height={16} />
          </div>
        )}
      </div>

      {/* Bottom Gradient and Title */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-4 pt-16 bg-gradient-to-t from-background/95 via-background/80 to-transparent flex flex-col justify-end pointer-events-none transition-all duration-300">
        <h3 className="text-sm font-bold text-foreground leading-tight drop-shadow-md line-clamp-2 pb-1">
          {titleItem.ProductTitle}
        </h3>
        {titleItem.PublisherName && (
          <p className="text-[10px] text-default-500 font-medium uppercase tracking-wider line-clamp-1">{titleItem.PublisherName}</p>
        )}
      </div>
    </Card>
  );
}

export default TitleItem;
