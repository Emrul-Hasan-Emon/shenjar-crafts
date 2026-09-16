import { createClient } from "@server/supabase/server-client";
import { listBoardColors } from "@server/boards/colors";
import { listBoardThicknesses } from "@server/boards/thicknesses";
import { listBoards } from "@server/boards/boards";
import BoardColorsManager from "./BoardColorsManager";
import BoardThicknessesManager from "./BoardThicknessesManager";
import BoardsManager from "./BoardsManager";

export default async function BoardsPage() {
  const supabase = await createClient();
  const [colors, thicknesses, boards] = await Promise.all([
    listBoardColors(supabase),
    listBoardThicknesses(supabase),
    listBoards(supabase),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">Boards</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Manage board colors, thicknesses, and the priced boards used when measuring a
        Craft Design.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BoardColorsManager colors={colors} />
        <BoardThicknessesManager thicknesses={thicknesses} />
      </div>

      <div className="mt-8">
        <BoardsManager boards={boards} colors={colors} thicknesses={thicknesses} />
      </div>
    </div>
  );
}
