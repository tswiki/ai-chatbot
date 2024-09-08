
export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8 text-center">
        <h1 className="text-lg font-semibold">
          Welcome to the Creators' Library.
        </h1>
        <p></p>
        <p className="leading-normal text-muted-foreground">
          We enhance the connection between creators and their audiences by transforming 
          educational content into immersive and interactive experiences.</p>
        <p></p>
        <p className="leading-normal text-muted-foreground">
          Our approach makes the learning and implementation behind these concepts more intuitive and relevant to the end user allowing them to augment them into their creative strategy and thought patterns. </p>
      </div>
    </div>
  )
}