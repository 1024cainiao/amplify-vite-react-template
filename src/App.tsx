import {useEffect, useState} from "react";
import type {Schema} from "../amplify/data/resource";
import {generateClient} from "aws-amplify/data";

const client = generateClient<Schema>();

function App() {
    const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
    const [persons, setPersons] = useState<Array<Schema["Person"]["type"]>>([])

    useEffect(() => {
        client.queries.searchTodos({from: 0, size: 50, content: "3", done: false}).then(res => {
            console.log(res);
        })

        client.models.Todo.observeQuery().subscribe({
            next: (data) => setTodos([...data.items]),
        });

        client.models.Person.observeQuery().subscribe({
            next: (data) => setPersons([...data.items])
        })
    }, []);

    const priorityArray = ["low", "medium", "high"];

    function createTodo() {
        client.models.Todo.create({
            content: window.prompt("Todo content"),
            done: Math.round(Math.random() * 10) % 2 == 0,
            priority: (priorityArray[Math.round(Math.random() * 10) % 3] as "low" | "medium" | "high")
        });
    }

    function createPerson() {
        client.models.Person.create({
            name: window.prompt("Person name") ?? "匿名",
            age: Math.round(Math.random() * 10)
        });
    }

    return (
        <main>
            <h1>My todos</h1>
            <button onClick={createTodo}>+ new todo</button>
            <ul>
                {todos.map((todo) => (
                    <li key={todo.id}>{`${todo.content} | ${todo.done} | ${todo.priority}`}</li>
                ))}
            </ul>
            <br/>
            <button onClick={createPerson}>+ new person</button>
            <ul>
                {persons.map((person) => (
                    <li key={person.id}>{`${person.name} | ${person.age}`}</li>
                ))}
            </ul>
            <div>
                🥳 App successfully hosted. Try creating a new todo.
                <br/>
                <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates">
                    Review next step of this tutorial.
                </a>
            </div>
        </main>
    );
}

export default App;
