-- Create join table for PlatVersion <-> Tags
CREATE TABLE "_PlatVersionToTags" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- Add indexes for relation table
CREATE INDEX "_PlatVersionToTags_A_index" ON "_PlatVersionToTags"("A");
CREATE INDEX "_PlatVersionToTags_B_index" ON "_PlatVersionToTags"("B");

-- Add unique constraint to prevent duplicate associations
CREATE UNIQUE INDEX "_PlatVersionToTags_AB_unique" ON "_PlatVersionToTags"("A", "B");

-- Add foreign keys
ALTER TABLE "_PlatVersionToTags" ADD CONSTRAINT "_PlatVersionToTags_A_fkey" FOREIGN KEY ("A") REFERENCES "PlatVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_PlatVersionToTags" ADD CONSTRAINT "_PlatVersionToTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
