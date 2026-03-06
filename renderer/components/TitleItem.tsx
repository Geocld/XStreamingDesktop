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
      className="group relative w-full aspect-square rounded-2xl overflow-hidden border border-white/5 bg-[#16161F] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:border-primary/50"
      onClick={handleClick}
    >
      {titleItem.Image_Tile && (
        <Image
          removeWrapper
          alt={titleItem.ProductTitle}
          className="z-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          src={"https:" + titleItem.Image_Tile.URL}
        />
      )}

      {/* Badges */}
      <div className="absolute top-2 right-2 z-20 flex flex-col gap-1.5 opacity-90 transition-opacity duration-300 group-hover:opacity-100">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-black/40 backdrop-blur-md border border-white/10 shadow-sm">
          <Image src={"/images/icons/gamepad.svg"} alt="gamepad" width={14} height={14} className="brightness-200" />
        </div>
        {isSupportMKB && (
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600/40 backdrop-blur-md border border-blue-400/30 shadow-sm">
            <Image src={"/images/icons/keyboard-mouse.svg"} alt="mkb" width={14} height={14} className="brightness-200" />
          </div>
        )}
      </div>

      {/* Bottom Gradient and Title */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-3 pt-12 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col justify-end pointer-events-none">
        <h3 className="text-xs sm:text-sm font-semibold text-white/95 leading-tight drop-shadow-md line-clamp-2">
          {titleItem.ProductTitle}
        </h3>
      </div>
    </Card>
  );
}

export default TitleItem;
